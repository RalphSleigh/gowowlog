package main

import (
	//"fmt"
	"os"
	//"github.com/davecgh/go-spew/spew"
	"encoding/json"
	"github.com/ActiveState/tail"
	//"github.com/gorilla/websocket"
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
	//"time"
	"flag"
	"os/signal"
	"runtime/pprof"
	//"errors"
	//"io"
	//"github.com/ActiveState/tail/ratelimiter"
)

type empty interface{}

type appContext struct {
	lf *logFile
}

type appHandler struct {
	aC      *appContext
	handler func(*appContext, http.ResponseWriter, *http.Request) (int, error)
}

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
		case http.StatusNotFound:
			http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		default:
			// Catch any other errors we haven't explicitly handled
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
	}
}

func iconHandler(w http.ResponseWriter, r *http.Request) {
	//check icon cache, if not get from Blizzard.]
	//TODO: Fix errors
	vars := mux.Vars(r)
	spellID := vars["id"]
	if spellID == "0" {
		spellID = "88163"
	}

	f, err := os.Open("webfiles/icons/" + spellID)
	if err != nil {
		//log.Print("Getting icon")
		infoRequest, _ := http.Get("http://eu.battle.net/api/wow/spell/" + spellID)
		jsonBytes, _ := ioutil.ReadAll(infoRequest.Body)
		v := make(map[string]interface{})
		json.Unmarshal(jsonBytes, &v)

		_, ok := v["icon"]
		if !ok {
			http.Error(w, "no icon", http.StatusNotFound)
			return
		}
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

func iconStringHandler(w http.ResponseWriter, r *http.Request) {
	//check icon cache, if not get from Blizzard.]
	//TODO: Fix errors
	vars := mux.Vars(r)
	spell := vars["spell"]

	f, err := os.Open("webfiles/icons/" + spell)
	if err != nil {
		//log.Print("Getting icon")
		//log.Print(jsonBytes)
		iconRequest, _ := http.Get("http://eu.media.blizzard.com/wow/icons/56/" + spell + ".jpg")
		iconBytes, _ := ioutil.ReadAll(iconRequest.Body)
		w.Write(iconBytes)
		o, _ := os.Create("webfiles/icons/" + spell)
		o.Write(iconBytes)
		o.Close()
	} else {
		iconBytes, _ := ioutil.ReadAll(f)
		w.Write(iconBytes) //write out icon

	}
	f.Close()
}

var logfile, webfiles *string
var parsespeed *float64

func init() {
	logfile = flag.String("logfile", "", "Logfile to parse")
	webfiles = flag.String("webroot", os.Getenv("GOPATH")+"/src/ralphsleigh/gowowlog/webfiles/", "location of web assets, defaults to source in your gopath")
	parsespeed = flag.Float64("parsespeed", 0, "Speed multiplier for parser, 0 is no limit, 1 parses in real time")
}

func main() {
	flag.Parse()
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		for sig := range c {
			// sig is a ^C, handle it
			log.Print(sig)
			pprof.StopCPUProfile()
			os.Exit(0)
		}
	}()

	//PROFILING
	var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			log.Fatal(err)
		}
		pprof.StartCPUProfile(f)

	}
	//STOP PROFILLING

	//open log
	//logFileReader, err := tail.TailFile(*logfile, tail.Config{Follow: true, Poll: true, RateLimiter: ratelimiter.NewLeakyBucket(1000, 1*time.Second)})
	logFileReader, err := tail.TailFile(*logfile, tail.Config{Follow: true, Poll: true, MustExist: true})

	if err != nil {
		log.Fatal("Cant open file")
	}

	logFile := NewLogFile(logFileReader, *parsespeed)

	go logFile.ParseLogFile()

	aC := &appContext{}
	aC.lf = logFile

	r := mux.NewRouter()
	api := r.PathPrefix("/api").Subrouter()

	api.Handle("/e", appHandler{aC, RESTEncounters})
	api.Handle("/e/{eID:[0-9]+}", appHandler{aC, RESTEncounterDetails})
	api.Handle("/e/{eID:[0-9]+}/p/{pID}/spells", appHandler{aC, RESTSpellsDetails})
	api.Handle("/e/{eID:[0-9]+}/p/{pID}/auras", appHandler{aC, RESTAuraDetails})
	//http://ts.xavius.org:8081/api/e/35/damage/sources/Player-3391-068199AA/Creature-0-3110-1228-11995-79956-000136E465
	api.Handle("/e/{eID:[0-9]+}/damage/sources/{sID}/{tID}", appHandler{aC, RESTDamageSources})

	r.HandleFunc("/icons/{id:[0-9]+}", iconHandler)
	r.HandleFunc("/icons/{spell:[a-zA-Z0-9_]+}", iconStringHandler)

	r.PathPrefix("/").Handler(http.FileServer(http.Dir(*webfiles)))

	http.Handle("/", r)
	log.Print("Serving")

	log.Fatal(http.ListenAndServe(":8081", nil))
}
