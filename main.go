package main

import (
	//"fmt"
	"os"
	//"github.com/davecgh/go-spew/spew"
	"encoding/json"
	"github.com/ActiveState/tail"
	"github.com/gorilla/websocket"
	"io/ioutil"
	"log"
	"net/http"
	"time"
	"flag"
	"runtime/pprof"
	"os/signal"
	//"io"
)

type empty interface{}

type appContext struct {
	lf       *logFile
	wsList   map[*websocket.Conn]bool //do we need a bool? only need the value really
	requests chan (*requestItem)
}

type appHandler struct {
	aC      *appContext
	handler func(*appContext, http.ResponseWriter, *http.Request) (int, error)
}

type requestItem struct {
	conn *websocket.Conn
	data interface{}
}

type dataMap map[string]interface{}

func (ah appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if status, err := ah.handler(ah.aC, w, r); err != nil {
		// We could also log our errors centrally:
		// i.e. log.Printf("HTTP %d: %v", err)
		switch status {
		// We can have cases as granular as we like, if we wanted to
		// return custom errors for specific status codes.
		//case http.StatusNotFound:
		//    notFound(w, r)
		case http.StatusInternalServerError:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		default:
			// Catch any other errors we haven't explicitly handled
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
	}
}

func (c *appContext) readSocket(conn *websocket.Conn) {
	for {
		var v dataMap
		err := conn.ReadJSON(&v)
		if err != nil {
			log.Println("ReadError", err)
			return
		}
		c.requests <- &requestItem{conn, v}
	}
}

func (c *appContext) processRequests() {
	log.Println("Processing")
	for n := range c.requests {
		j, ok := n.data.(dataMap)
		if ok {
			s := j["request"].(string)
			switch s {
			case "encounters":
				c.lf.sendEncounters(n, j)
			case "unitSpells":
				c.lf.sendUnitSpells(n, j)
			case "unitAuras":
				c.lf.sendUnitAuras(n, j)
			case "classStrings":
				c.lf.sendClassStrings(n, j)
			}
		} else {

			log.Println(j)
		}
	}
}

func applicationPing(conn *websocket.Conn) {

	t := time.NewTicker(10 * time.Second)

	for range t.C {
		if err := conn.WriteJSON(&returnJSON{}); err != nil {
			t.Stop()
		}
	}

}

func websocketHandler(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	var upgrader = websocket.Upgrader{}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return http.StatusOK, nil
	}
	go applicationPing(conn)
	c.wsList[conn] = true

	c.readSocket(conn)

	delete(c.wsList, conn)
	return http.StatusOK, nil
}

func iconHandler(w http.ResponseWriter, r *http.Request) {
	//check icon cache, if not get from Blizzard.]
	//TODO: Fix errors
	spellID := r.URL.RawQuery

	if spellID == "0" {
		spellID = "88163"
	}

	f, err := os.Open("webfiles/icons/" + spellID)
	if err != nil {
		log.Print("Getting icon")
		infoRequest, _ := http.Get("http://eu.battle.net/api/wow/spell/" + spellID)
		jsonBytes, _ := ioutil.ReadAll(infoRequest.Body)
		v := make(map[string]interface{})
		json.Unmarshal(jsonBytes, &v)
		//log.Print(jsonBytes)
		iconRequest, _ := http.Get("http://eu.media.blizzard.com/wow/icons/56/" + v["icon"].(string) + ".jpg")
		iconBytes, _ := ioutil.ReadAll(iconRequest.Body)
		w.Write(iconBytes)
		o, _ := os.Create("webfiles/icons/" + spellID)
		o.Write(iconBytes)
		o.Close()
	} else {
		iconBytes, _ := ioutil.ReadAll(f)
		w.Write(iconBytes) //write out icon

	}
	f.Close()
}

func main() {
	
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func(){
		for sig := range c {
        // sig is a ^C, handle it
		log.Print(sig)
		pprof.StopCPUProfile()
		os.Exit(0)
		}
	}()
	
	var logfile = flag.String("logfile", "", "Logfile to parse")
	//PROFILING
	var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")
	
	flag.Parse()
    if *cpuprofile != "" {
        f, err := os.Create(*cpuprofile)
        if err != nil {
            log.Fatal(err)
        }
        pprof.StartCPUProfile(f)
        
    }
	//STOP PROFILLING
	
	//open log
	logFileReader, err := tail.TailFile(*logfile, tail.Config{Follow: true, Poll: true})
	//logFileReader, err := os.Open(os.Args[1])
	if err != nil {
		log.Fatal("Cant open file")
	}

	logFile := NewLogFile(logFileReader)
	//logFile.classIdent = getClassMap()

	go  logFile.ParseLogFile()

	
	
	aC := &appContext{}
	aC.lf = logFile
	aC.wsList = make(map[*websocket.Conn]bool)
	aC.requests = make(chan (*requestItem))
	go aC.processRequests()

	http.Handle("/websockets", appHandler{aC, websocketHandler})
	http.HandleFunc("/icons", iconHandler)
	http.Handle("/", http.FileServer(http.Dir("webfiles/")))

	log.Print("Serving")

	log.Fatal(http.ListenAndServe(":8081", nil))
}
