package main

import (
	//"bufio"
	//"io"
	//"fmt"
	//"encoding/csv"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"
	"strings"
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
	Unit     string
	Duration int //seconds
}

type RESTAuraEvent struct {
	Time   int //seconds in
	Stacks int //set  to 0 to indicate removed?
	Amount int //stuff like absorb assuming we can track.
}

type RESTAuraResponse struct {
	ID       int
	SourceID string
	Name     string
	Class    int
	Uptime   time.Duration
	Events   []RESTAuraEvent
}

func RESTAuraDetails(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {

	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])

	var e *encounter

	for _, v := range c.lf.encounters {
		if v.ID == eID {
			e = v
		}
	}
	
	if e.ID == 0 {
		log.Printf("Cant find encounter #%v",eID);
		return http.StatusNotFound, errors.New("Encounter not found")
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

		r := RESTAuraResponse{k.auraID, k.source.guid, name, k.source.Class, 0, nil}
		var timeup, timedown time.Duration
		//knobbly code inc
		var prevTime = e.StartTime
		var RESTevents = make([]RESTAuraEvent, 0, 50)

		if len(a.events) == 0 {
			log.Print(a)
			continue
			//return http.StatusOK, nil //this is dumb
		}

		first := a.events[0]

		if first.stacks == 0 {
			RESTevents = append(RESTevents, RESTAuraEvent{0, 1, 0})
		} else {
			RESTevents = append(RESTevents, RESTAuraEvent{0, 0, 0})
		}

		for _, event := range a.events {
			//var revent = AuraEventResponse{event.time.Sub(e.StartTime), event.stacks}
			RESTevents = append(RESTevents, RESTAuraEvent{int(event.time.Sub(e.StartTime)), event.stacks, event.amount})
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

	js, _ := json.Marshal(RESTAuraDetailsResponse{resp, vars["pID"], int(e.EndTime.Sub(e.StartTime))})
	w.Write(js)
	return http.StatusOK, nil
}



type RESTTargetResponse struct {
	Total int
	Units map[string]int
	Class int
}

type RESTSpellsDetailsResponse struct {
	Damage  []RESTSpellResponse
	Healing []RESTSpellResponse
	DamageTargets map[string]RESTTargetResponse
	HealingTargets map[string]RESTTargetResponse
	//Casts  []unitCast
	Unit string
}

func RESTSpellsDetails(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {

	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])

	var e *encounter

	for _, v := range c.lf.encounters {
		if v.ID == eID {
			e = v
		}
	}
	
	if e.ID == 0 {
		log.Printf("Cant find encounter #%v",eID);
		return http.StatusNotFound, errors.New("Encounter not found")
	}

	u, ok := e.UnitMap[vars["pID"]]
	if !ok {
		log.Printf("Cant find %s in unitmap %v start at %v", vars["pID"], e.Name, e.StartTime)
		return http.StatusNotFound, errors.New("Player not found")
	}

	combinedMapDamage := make(map[string]*RESTSpellResponse)
	combinedMapHealing := make(map[string]*RESTSpellResponse)
	combinedMapDamageTargets := make(map[string]RESTTargetResponse)
	combinedMapHealingTargets := make(map[string]RESTTargetResponse)

	//log.Print(u)

	for id, s := range u.spells {

		sR, ok := combinedMapDamage[s.name]
		if !ok {
			sR = &RESTSpellResponse{SpellID: id, SpellName: s.name, School: s.school, Casts: s.casts}
			combinedMapDamage[s.name] = sR
		} else {
			sR.Casts += s.casts
		}
		for _, e := range s.damageEvents {
			sR.add(e)
			//targets
			name, ok := combinedMapDamageTargets[e.target.name]
			if !ok {
				name.Units = make(map[string]int)
				}
			name.Total += e.amount;
			name.Units[e.target.guid] += e.amount
			combinedMapDamageTargets[e.target.name] = name
		}

		sRH, okH := combinedMapHealing[s.name]
		if !okH {
			sRH = &RESTSpellResponse{SpellID: id, SpellName: s.name, School: s.school, Casts: s.casts}
			combinedMapHealing[s.name] = sRH
		} else {
			sR.Casts += s.casts
		}
		for _, e := range s.healingEvents {
			sRH.add(e)
			name, ok := combinedMapHealingTargets[e.target.name]
			if !ok {
				name.Units = make(map[string]int)
				if e.target.owner != nil {
					name.Class = e.target.owner.Class;
				} else {
					name.Class = e.target.Class;
				 }
			}
			name.Total += e.amount;
			name.Units[e.target.guid] += e.amount
			combinedMapHealingTargets[e.target.name] = name
		}

	}

	for _, pet := range u.pets {
		for id, s := range pet.spells {
			petSpellName := pet.name + " - " + s.name
			sR, ok := combinedMapDamage[petSpellName]
			if !ok {
				sR = &RESTSpellResponse{SpellID: id, SpellName: petSpellName, School: s.school, Casts: s.casts}
				combinedMapDamage[petSpellName] = sR
			}
			for _, e := range s.damageEvents {
				sR.add(e)
				name, ok := combinedMapDamageTargets[e.target.name]
				if !ok {
					name.Units = make(map[string]int)
					
				}
				name.Total += e.amount;
				name.Units[e.target.guid] += e.amount
				combinedMapDamageTargets[e.target.name] = name
			}
		}
	}

	for _, pet := range u.pets {
		for id, s := range pet.spells {
			petSpellName := pet.name + " - " + s.name
			sR, ok := combinedMapHealing[petSpellName]
			if !ok {
				sR = &RESTSpellResponse{SpellID: id, SpellName: petSpellName, School: s.school, Casts: s.casts}
				combinedMapHealing[petSpellName] = sR
			}
			for _, e := range s.healingEvents {
				sR.add(e)
				name, ok := combinedMapHealingTargets[e.target.name]
			if !ok {
				name.Units = make(map[string]int)
				if e.target.owner != nil {
					name.Class = e.target.owner.Class;
				} else {
					name.Class = e.target.Class;
				 }
				}
			name.Total += e.amount;
			name.Units[e.target.guid] += e.amount
			combinedMapHealingTargets[e.target.name] = name
			}
		}
	}

	resp := make([]RESTSpellResponse, 0, len(combinedMapDamage))
	respH := make([]RESTSpellResponse, 0, len(combinedMapHealing))

	for _, v := range combinedMapDamage {
		resp = append(resp, *v)
	}

	for _, v := range combinedMapHealing {
		respH = append(respH, *v)
	}

	
	w.Header().Add("Cache-Control","public,max-age=300")
	js, _ := json.Marshal(RESTSpellsDetailsResponse{resp, respH, combinedMapDamageTargets,combinedMapHealingTargets, vars["pID"]})
	w.Write(js)
	return http.StatusOK, nil

}

type restEncounterList struct {
	ID         int
	Name       string
	Duration   time.Duration
	Difficulty int
	Kill       bool
	Live       bool
}

type restUnitInfo struct {
	ID string
	Name string
}

type restEncounterDetails struct {
	ID            int
	Name          string
	StartTime     time.Time
	EndTime       time.Time
	Duration      time.Duration
	PlayerDPS     []playerDPS
	PlayerHealing []playerDPS
	Hostiles      []restUnitInfo
}

func RESTEncounterDetails(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])

	var v *encounter

	for _, e := range c.lf.encounters {
		if e.ID == eID {
			v = e
		}
	}
	
	if v.ID == 0 {
		log.Printf("Cant find encounter #%v",eID);
		return http.StatusNotFound, errors.New("Encounter not found")
	}
	

	Hostiles := make([]restUnitInfo,0,10)

	for _,u := range v.UnitMap {
			if u.hostile {
				Hostiles = append(Hostiles, restUnitInfo{u.guid, u.name})
			}
		}

	v.GetPlayerClassSpec(c.lf)

	resp := restEncounterDetails{v.ID, v.Name, v.StartTime, v.EndTime, v.EndTime.Sub(v.StartTime), v.GetPlayerDPS(c.lf, false), v.GetPlayerDPS(c.lf, true), Hostiles}

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
		resp = append(resp, restEncounterList{v.ID, v.Name, v.EndTime.Sub(v.StartTime), v.Difficulty, v.Kill, v.Live})
	}
	//err := c.conn.WriteJSON(returnJSON{"system.updateEncounters", resp})
	//c.conn.WriteJSON(msg)
	js, _ := json.Marshal(resp)
	w.Write(js)
	return http.StatusOK, nil
}

type RESTDamageSourceUnit struct {
	Name string
	Damage int
	ID  string
	Class int
	Spec int
}

func RESTDamageSources(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])
	sID := vars["sID"]
	tID := vars["tID"]

	e, ok := c.lf.encounters[eID]

	if !ok {
		log.Printf("Cant find encounter #%v",eID);
		return http.StatusNotFound, errors.New("Encounter not found")	
	}

	sourceUnits := e.UnitMap.FilterUnits(sID, true, false)

	targetUnits := e.UnitMap.FilterUnits(tID, false, true)

	response := make([]RESTDamageSourceUnit,0,0)

	for _, unit := range sourceUnits {
		playerDamage := unit.getUnitDamageTotal(targetUnits, true)
		response = append(response, RESTDamageSourceUnit{unit.name, playerDamage, unit.guid, unit.Class, unit.Spec})
	}

	js, _ := json.Marshal(response)
	w.Write(js)
	return http.StatusOK, nil
}

func RESTDamageTargets(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])
	sID := vars["sID"]
	tID := vars["tID"]

	e, ok := c.lf.encounters[eID]

	if !ok {
		log.Printf("Cant find encounter #%v",eID);
		return http.StatusNotFound, errors.New("Encounter not found")	
	}

	sourceUnits := e.UnitMap.FilterUnits(sID, true, false)

	targetUnits := e.UnitMap.FilterUnits(tID, false, true)

	response := e.getDamageToTargets(sourceUnits,targetUnits)

	js, _ := json.Marshal(response)
	w.Write(js)
	return http.StatusOK, nil
}

func RESTDamageAbilities(c *appContext, w http.ResponseWriter, r *http.Request) (int, error) {
	vars := mux.Vars(r)
	eID, _ := strconv.Atoi(vars["eID"])
	sID := vars["sID"]
	tID := vars["tID"]

	e, ok := c.lf.encounters[eID]

	if !ok {
		log.Printf("Cant find encounter #%v",eID);
		return http.StatusNotFound, errors.New("Encounter not found")	
	}

	sourceUnits := e.UnitMap.FilterUnits(sID, true, false)

	targetUnits := e.UnitMap.FilterUnits(tID, false, true)

	response := e.getDamageByAbility(sourceUnits,targetUnits)

	js, _ := json.Marshal(response)
	w.Write(js)
	return http.StatusOK, nil
}

func (u UnitMap) FilterUnits(filter string,  player bool, hostile bool) UnitMap {
	returnMap := make(UnitMap)
	switch {
		case filter == "all":
			for id, unit := range u {
				if player && !unit.isPlayer{
					continue
				}
				if hostile && !unit.hostile{
					continue
				}
				returnMap[id] = unit
			}
		case strings.HasPrefix(filter,"name:"):
			//all the units named name:
			name := strings.TrimPrefix(filter,"name:") 
			for id, unit := range u {
				if unit.name == name {
					returnMap[id] = unit
				}
			}
		default:
			for id, unit := range u {
				if id == filter {
					returnMap[id] = unit
				}
			}
	}
	return returnMap
}
