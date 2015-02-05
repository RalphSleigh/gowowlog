package main

import (
	//"bufio"
	//"io"
	//"fmt"
	//"encoding/csv"
	"net/http"
	"encoding/json"
	"log"
	"time"
	"errors"
	"strconv"
	//"strings"
	"github.com/gorilla/mux"
)

/*
func RESTHandler(c *appContext, w http.ResponseWriter, r *http.Request) (int, error){
	//Handle RESTFul requests for angular, whatever they are...
	
	log.Print(r.URL)
	w.Header().Set("Content-Type", "application/json")
	
	elements := make([]string,10,10)
	uriSegments := strings.Split(r.URL.Path, "/")
	copy(elements, uriSegments)
	
	//
	switch elements[2] {
		case "encounters":
			eID, _ := strconv.Atoi(elements[3])
			if eID > 0 {
				return RESTEncounterDetails(c,w,r, eID)
			} else  {
				return RESTEncounters(c,w,r)
			}
		case "players":
			switch elements[3] {
			case "spells":
				values := r.URL.Query()
				eID, _ := strconv.Atoi(values.Get("e"))
				pID := elements[4]
				return RESTPlayerDetails(c,w,r, eID, pID)
			case "auras":
				values := r.URL.Query()
				eID, _ := strconv.Atoi(values.Get("e"))
				pID := elements[4]
				return RESTAuraDetails(c,w,r, eID, pID)
			}
	}
	return http.StatusNotFound, errors.New("Resource not found")
}

*/
type RESTAuraDetailsResponse struct {
	Auras []RESTAuraResponse
	//Casts  []unitCast
	Unit   string
	Duration int //seconds
	}

type RESTAuraEvent struct {
	Time   int //seconds in
	Stacks int //set  to 0 to indicate removed?
	Amount int //stuff like absorb assuming we can track.
}



type RESTAuraResponse struct {
	ID     int
	SourceID string
	Name   string
	Class  int
	Uptime time.Duration
	Events []RESTAuraEvent
}


func RESTAuraDetails(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	
	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])
	
	var e *encounter 
	
	for _, v := range c.lf.encounters {
		if v.ID == eID{
			e = v
		}
	}
	
	u, ok := e.UnitMap[vars["pID"]]
	if !ok {
		log.Printf("Cant find %s in unitmap %v start at %v", vars["pID"], e.Name, e.StartTime)
		return http.StatusNotFound, errors.New("Player not found")
	}

	resp := make([]RESTAuraResponse, 0, len(u.auras))

	for k, a := range u.auras {
		//if k.source.owner != nil {
		//	k.source = k.source.owner
		//}
		name := a.name
		if k.source != u { //not self applied
			name = a.name + " (" + k.source.name + ")"

		}

		r := RESTAuraResponse{k.auraID,k.source.guid, name, k.source.Class, 0,nil}
		var timeup, timedown time.Duration
		//knobbly code inc
		var prevTime = e.StartTime
		var RESTevents = make([]RESTAuraEvent, 0,50)
		
		
		if len(a.events) == 0 {
			log.Print(a)
			continue
			//return http.StatusOK, nil //this is dumb
		}
		
		
		first := a.events[0];
		
		if(first.stacks == 0) {
			RESTevents = append(RESTevents, RESTAuraEvent{0,1,0})
		} else {
			RESTevents = append(RESTevents, RESTAuraEvent{0,0,0})
		}
		
		for _, event := range a.events {
			//var revent = AuraEventResponse{event.time.Sub(e.StartTime), event.stacks}
			RESTevents = append(RESTevents, RESTAuraEvent{int(event.time.Sub(e.StartTime)),event.stacks,event.amount})
			if event.stacks == 0 {
				timeup += event.time.Sub(prevTime)
			} else {
				timedown += event.time.Sub(prevTime)
			}
			prevTime = event.time
		}

		r.Uptime = (timeup * 100) / e.EndTime.Sub(e.StartTime)
		r.Events = RESTevents
		resp = append(resp, r)
	}
	
	js, _ := json.Marshal(RESTAuraDetailsResponse{resp,vars["pID"],int(e.EndTime.Sub(e.StartTime))})
	w.Write(js)
	return http.StatusOK, nil
}


type RESTSpellsDetailsResponse struct {
	Spells []spellResponse
	//Casts  []unitCast
	Unit   string
}

func RESTSpellsDetails(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])
	
	
	var e *encounter 
	
	for _, v := range c.lf.encounters {
		if v.ID == eID{
			e = v
		}
	}
	
	u, ok := e.UnitMap[vars["pID"]]
	if !ok {
		log.Printf("Cant find %s in unitmap %v start at %v", vars["pID"], e.Name, e.StartTime)
		return http.StatusNotFound, errors.New("Player not found")
	}
	
	combinedMap := make(map[string]*spellResponse)

	//log.Print(u)

	for id, s := range u.spells {
		
		sR, ok := combinedMap[s.name]
		if !ok {
			sR = &spellResponse{SpellID: id, SpellName: s.name, School:s.school, Casts: s.casts}
			combinedMap[s.name] = sR
		} else {
			sR.Casts += s.casts
		}
		for _,e := range s.damageEvents {	
			sR.add(e)
		}
		
	}

	for _, pet := range u.pets {
		for id, s := range pet.spells {
			petSpellName := pet.name + " - " + s.name
			sR, ok := combinedMap[petSpellName]
			if !ok {
				sR = &spellResponse{SpellID: id, SpellName: petSpellName, School:s.school, Casts: s.casts}
				combinedMap[petSpellName] = sR
			}
			for _,e := range s.damageEvents {	
				sR.add(e)
			}
		}
	}
	
	resp := make([]spellResponse,0,len(combinedMap))
	
	for _,v := range combinedMap {
		resp = append(resp, *v)
	}
	
	js, _ := json.Marshal(RESTSpellsDetailsResponse{resp,vars["pID"]})
	w.Write(js)
	return http.StatusOK, nil

}

type restEncounterList struct {
		ID int
		Name string
		Duration time.Duration 
		Difficulty int
		Kill bool
		Live bool
} 

type restEncounterDetails struct {
		ID int
		Name      string
		StartTime time.Time
		EndTime   time.Time
		Duration  time.Duration
		PlayerDPS []playerDPS
} 

func RESTEncounterDetails(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])
	
	var v *encounter 
	
	for _, e := range c.lf.encounters {
		if e.ID == eID{
			v = e
		}
	}
	v.GetPlayerClassSpec(c.lf)


	resp := restEncounterDetails{v.ID, v.Name, v.StartTime, v.EndTime, v.EndTime.Sub(v.StartTime), v.GetPlayerDPS(c.lf)}
	
	
	js, _ := json.Marshal(resp)
	w.Write(js)
	return http.StatusOK, nil
}

func RESTEncounters(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	resp := make([]restEncounterList, 0, len(c.lf.encounters))
	for _, v := range c.lf.encounters {
		if !v.IsBoss {
			continue
		}
		v.GetPlayerClassSpec(c.lf)
		resp = append(resp, restEncounterList{v.ID, v.Name, v.EndTime.Sub(v.StartTime),v.Difficulty,v.Kill, v.Live})
	}
	//err := c.conn.WriteJSON(returnJSON{"system.updateEncounters", resp})
	//c.conn.WriteJSON(msg)
	js, _ := json.Marshal(resp)
	w.Write(js)
	return http.StatusOK, nil
}