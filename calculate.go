package main

import (
	//"github.com/davecgh/go-spew/spew"
	//"strings"
	//"github.com/gorilla/websocket"
	//"log"
	//"strconv"
	"time"
)

type playerDPS struct {
	ID     string
	Name   string
	Class  int
	Spec   int
	Damage int
	DPS    int
}

func (e *encounter) GetPlayerDPS(lf *logFile) []playerDPS {

	//log.Printf("%v %v %v", e.StartTime, e.EndTime, e.IsBoss)

	result := make([]playerDPS, 0, len(e.UnitMap))
	//resp := make([]encounterJSON, 0, len(lf.encounters))
	duration := e.EndTime.Sub(e.StartTime)

	for id, unit := range e.UnitMap {

		if !unit.isPlayer {
			continue
		}
		playerDamage := unit.getUnitDamageTotal()
		for _, pet := range unit.pets {
			playerDamage += pet.getUnitDamageTotal()
		}
		result = append(result, playerDPS{id, unit.name, unit.Class, unit.Spec, playerDamage, playerDamage / int(duration.Seconds())})
	}

	return result
}

func (u *wunit) getUnitDamageTotal() int {

	if u == nil {
		return 0 //pet that never appeared in UnitMap cause no events
	}
	var totalDamage int

	for _, spell := range u.spells {
		for _, e  := range spell.damageEvents {
			totalDamage += e.amount
			totalDamage += e.absorb
		}
	}
	
	return totalDamage
}

//These functions feed data to the client

type returnJSON struct {
	Action string
	Data   interface{}
}

type encounterJSON struct {
	ID        int
	Name      string
	StartTime time.Time
	EndTime   time.Time
	Duration  time.Duration
	PlayerDPS []playerDPS
}

/*
func (lf *logFile) sendClassStrings(c *requestItem, d dataMap) {

	m := make(map[string]classString)

	for k, v := range GetClassStrings() {
		m[strconv.Itoa(k)] = v
	}

	msg := returnJSON{"system.classStrings", m}
	c.conn.WriteJSON(msg)
}

func (lf *logFile) sendEncounters(c *requestItem, d dataMap) {
	resp := make([]encounterJSON, 0, len(lf.encounters))
	for _, v := range lf.encounters {
		if !v.IsBoss {
			continue
		}
		v.GetPlayerClassSpec(lf)
		resp = append(resp, encounterJSON{v.ID, v.Name, v.StartTime, v.EndTime, v.EndTime.Sub(v.StartTime), v.GetPlayerDPS(lf)})
	}
	msg := returnJSON{"e.updateEncounters", resp}
	//err := c.conn.WriteJSON(returnJSON{"system.updateEncounters", resp})
	c.conn.WriteJSON(msg)
}
*/
type spellResponse struct {
	SpellID int
	SpellName string
	School int64
	Damage int
	Absorb int
	Casts int
	Hits int
	Ticks int
	Crits int
	Multis int
}

type spellResponseList struct {
	Spells []spellResponse
	Casts  []unitCast
	Unit   string
}

func (sp *spellResponse) add(e spellEvent) {
	
	/*
	type spellEvent struct {
	time time.Time
	target *wunit
	amount int
	absorb int
	tick bool
	crit bool
	multi bool
	}
	*/
	
	sp.Damage += e.amount
	sp.Absorb += e.absorb
	
	if e.multi {
		sp.Multis++
	}
	
	if e.crit {
		sp.Crits++
	}
		
	if e.tick && !e.multi {
		sp.Ticks++
	}
	
	if !e.tick && !e.multi {
		sp.Hits++
	}
	
	//return sp
}
/*
func (lf *logFile) sendUnitSpells(c *requestItem, d dataMap) {

	t, _ := time.Parse(time.RFC3339, d["encounter"].(string))
	unitid := d["unitid"].(string)

	e := lf.encounters[t]
	u, ok := e.UnitMap[unitid]
	if !ok {
		log.Printf("Cant find %s in unitmap %v start at %v", unitid, e.Name, e.StartTime)
		return
	}
	//take unit spells and combine ones with the same name into a new map. Also add pets spells.
	//need to do this because a spell in MoP/WoD seems to have several IDs between cast/damage/dot
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

	resp := make([]spellResponse, 0, len(combinedMap))

	for _, s := range combinedMap {
		resp = append(resp, *s)
	}

	msg := returnJSON{"system.unitSpellInfo", spellResponseList{resp, u.casts, unitid}}
	c.conn.WriteJSON(msg)

	/*
		for _,v := range u.auras {
				spew.Dump(v)
		}

}
*/
type AuraResponseList struct {
	Auras []AuraResponse
	Unit  string
}

type AuraResponse struct {
	ID     int
	Name   string
	Class  int
	Uptime time.Duration
	Events []AuraEventResponse
}

type AuraEventResponse struct {
	Time   time.Duration
	Stacks int
}
/*
func (lf *logFile) sendUnitAuras(c *requestItem, d dataMap) {
	t, _ := time.Parse(time.RFC3339, d["encounter"].(string))
	unitid := d["unitid"].(string)

	e := lf.encounters[t]
	u, ok := e.UnitMap[unitid]
	if !ok {
		log.Printf("Cant find %s in unitmap %v start at %v", unitid, e.Name, e.StartTime)
		return
	}

	resp := make([]AuraResponse, 0, len(u.auras))

	for k, a := range u.auras {
		if k.source.owner != nil {
			k.source = k.source.owner
		}
		name := a.name
		if k.source != u { //not self applied
			name = a.name + " (" + k.source.name + ")"

		}

		r := AuraResponse{k.auraID, name, k.source.Class, 0, make([]AuraEventResponse, 0, len(a.events))}
		var timeup, timedown time.Duration
		//knobbly code inc
		var prevTime = t
		for _, event := range a.events {
			var revent = AuraEventResponse{event.time.Sub(t), event.stacks}
			r.Events = append(r.Events, revent)
			if event.stacks == 0 {
				timeup += event.time.Sub(prevTime)
			} else {
				timedown += event.time.Sub(prevTime)
			}
			prevTime = event.time
		}

		r.Uptime = (timeup * 100) / e.EndTime.Sub(t)
		resp = append(resp, r)
	}
	/*

	type unitAuras map[auraKey]*unitAura

	type auraKey struct {
		auraID int
		source *wunit
	}

	type unitAura struct {
		name string
		school int64
		events []auraEvent
	}

	type auraEvent struct {
		time time.Time
		stacks int  //set  to 0 to indicate removed?
		amount int //stuff like absorb assuming we can track.
	}



	msg := returnJSON{"system.unitAuraInfo", AuraResponseList{resp, unitid}}
	c.conn.WriteJSON(msg)
}
*/