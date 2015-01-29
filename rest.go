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
	"strings"
)

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
			values := r.URL.Query()
			eID, _ := strconv.Atoi(values.Get("e"))
			pID := elements[3]
			return RESTPlayerDetails(c,w,r, eID, pID)
	}
	return http.StatusNotFound, errors.New("Resource not found")
}

type RESTPlayerDetailsResponse struct {
	Spells []spellResponse
	//Casts  []unitCast
	//Unit   string
}

func RESTPlayerDetails(c *appContext, w http.ResponseWriter, r *http.Request, eid int, pid string) (int, error) {
	
	var e *encounter 
	
	for _, v := range c.lf.encounters {
		if v.ID == eid{
			e = v
		}
	}
	
	u, ok := e.UnitMap[pid]
	if !ok {
		log.Printf("Cant find %s in unitmap %v start at %v", pid, e.Name, e.StartTime)
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
	
	js, _ := json.Marshal(RESTPlayerDetailsResponse{resp})
	w.Write(js)
	return http.StatusOK, nil

}

type restEncounterList struct {
		ID int
		Name string
		StartTime time.Time
} 

type restEncounterDetails struct {
		ID int
		Name      string
		StartTime time.Time
		EndTime   time.Time
		Duration  time.Duration
		PlayerDPS []playerDPS
} 

func RESTEncounterDetails(c *appContext, w http.ResponseWriter, r *http.Request, id int) (int, error) {
	
	var v *encounter 
	
	for _, e := range c.lf.encounters {
		if e.ID == id{
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
		resp = append(resp, restEncounterList{v.ID, v.Name, v.StartTime})
	}
	//err := c.conn.WriteJSON(returnJSON{"system.updateEncounters", resp})
	//c.conn.WriteJSON(msg)
	js, _ := json.Marshal(resp)
	w.Write(js)
	return http.StatusOK, nil
}