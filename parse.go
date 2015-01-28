package main

import (
	//"bufio"
	//"io"
	//"fmt"
	//"encoding/csv"
	"github.com/ActiveState/tail"
	"log"
	"strconv"
	"strings"
	"time"
	//"github.com/davecgh/go-spew/spew"
)

type wowEvent struct {
	eventType string
	eventTime time.Time
	fields    []string
}

type wunit struct {
	guid     string
	name     string
	isPlayer bool
	Class    int
	Spec     int
	spells   unitSpells
	pets     []*wunit
	owner    *wunit
	auras    unitAuras
	casts    []unitCast
}

type unitCast struct {
	SpellID   int
	SpellName string
	Time      time.Time
}

type unitAuras map[auraKey]*unitAura

type auraKey struct {
	auraID int
	source *wunit
}

type unitAura struct {
	name   string
	school int64
	events []auraEvent
}

type auraEvent struct {
	time   time.Time
	stacks int //set  to 0 to indicate removed?
	amount int //stuff like absorb assuming we can track.
}

type spellEvent struct {
	time time.Time
	target *wunit
	amount int
	absorb int
	tick bool
	crit bool
	multi bool
}

type spell struct {
	id int
	name string
	school int64
	casts int
	damageEvents []spellEvent
	healingEvents []spellEvent
}

type unitSpells map[int]*spell

type encounter struct {
	Name      string
	IsBoss    bool
	StartTime time.Time
	EndTime   time.Time
	UnitMap   UnitMap
	//PlayerMap   PlayerMap
}

type encounterMap map[time.Time]*encounter
type UnitMap map[string]*wunit

type petMap map[string]string

type eventMap map[string]int

type logFile struct {
	file             *tail.Tail
	encounters       encounterMap
	eventCount       eventMap
	currentEncounter *encounter
	//petOwners        petMap
	classIdent map[int]int
	buffer []byte
}

func NewLogFile(file *tail.Tail) *logFile {
	lf := new(logFile)
	lf.file = file
	lf.encounters = make(encounterMap)
	lf.eventCount = make(eventMap)
	lf.buffer = make([]byte,2048,2048)
	//lf.petOwners = make(petMap)

	return lf
}

func (lf *logFile) ParseLogFile() {

	now := time.Now()
	lf.newEncounter("trash")
	n := 0
	/*
		scanner := bufio.NewScanner(lf.file)
		for scanner.Scan() {

		}
	*/

	for line := range lf.file.Lines {

		lf.ParseLine(line.Text)
		//lf.ParseLine()

		if n%100000 == 0 && n != 0 {
			//log.Printf("Parsed %v lines",n)
			then := time.Now()
			duration := then.Sub(now).Seconds()
			speed := n / int(duration)
			log.Printf("Parsed %v entries in %v seconds (%v/sec)", n, int(duration), speed)
		}
		n++
	}
}

func quickerAlmostCSVParse(line string) []string {
	//This currently gets us 80k/lines sec. If we want faster need to returen byte slices and avoind 90% of string casts
	bytes := []byte(line)
	fields := make([]string, 60, 60)

	var comma, quotes, slash, nl, rl byte //ugly hacks
	comma = 44
	quotes = 34
	slash = 92
	nl = 10
	rl = 13

	insideQuotes := false
	haveSlash := false
	hadQuotes := false
	hadSlash := false

	fieldStart := 0
	fieldIndex := 0
	L:
	for i, r := range bytes {
		switch r {
		case slash:
			if insideQuotes {
				haveSlash = true
				hadSlash = true
			}
		case quotes:
			if !insideQuotes { //unquoted
				insideQuotes = true
				hadQuotes = true
				fieldStart = i + 1
			} else if haveSlash == true { //quoted, no slash
				haveSlash = false
			} else {
				//finished
				insideQuotes = false

				//	hadSlash = true

				//fieldStart = i + 2
			}

		case comma:
			if !insideQuotes && hadQuotes == true && hadSlash == true{
				fields[fieldIndex] = strings.Replace(string(bytes[fieldStart : i-1]),`\"`,`"`,-1)
			} else if !insideQuotes && hadQuotes == true{
				fields[fieldIndex] = string(bytes[fieldStart:i-1])
			} else {
				fields[fieldIndex] = string(bytes[fieldStart:i])
			}
			fieldIndex++
			fieldStart = i + 1
			hadQuotes = false
		case nl, rl:
			if hadQuotes == true && hadSlash == true{
				fields[fieldIndex] = strings.Replace(string(bytes[fieldStart : i-1]),`\"`,`"`,-1)
			} else if hadQuotes == true{
				fields[fieldIndex] = string(bytes[fieldStart:i-1])
			} else {
				fields[fieldIndex] = string(bytes[fieldStart:i])
			}
			break L
		}
	}
	//fields = append(fields,string(bytes[fieldStart:]))

	return fields
}



func (lf *logFile) ParseLine(line string)  {
	event := new(wowEvent)
	//use the CSV parser because Storm, Earth, and Fire. This will probably slow it down. TODO:  Write state machine here
	//parts := strings.Split(line, ",")
	/*
	csvline := strings.Replace(line, `\"`, `""`, -1)
	parts, err := csv.NewReader(strings.NewReader(csvline)).Read()
	if err != nil {
		log.Print(line)
		log.Fatal(err)
	}
	*/
	
	parts := quickerAlmostCSVParse(line)
	timeandevent := strings.Split(parts[0], "  ")

	event.eventType = timeandevent[1]
	event.fields = parts
	//var err error
	etime, err := time.Parse("1/2 15:04:05.000", timeandevent[0])
	if err != nil {
		log.Printf("Unable to parse time %v reason %v", timeandevent[0], err)
	}

	event.eventTime = etime
	//spew.Dump(err)

	switch timeandevent[1] {
	case "SPELL_CAST_SUCCESS":
		lf.parseSpellCastSuccess(event)
	case "SPELL_DAMAGE", "RANGE_DAMAGE":
		lf.parseSpellDamage(event)
	case "SPELL_PERIODIC_DAMAGE":
		lf.parseSpellPeriodicDamage(event)
	case "SPELL_HEAL":
		lf.parseSpellHeal(event)
	case "SPELL_ABSORBED":
		lf.parseSpellAbsorbed(event)
	case "SWING_DAMAGE_LANDED":
		lf.parseSwingDamageLanded(event)
	case "SPELL_SUMMON":
		lf.parseSpellSummon(event)
	case "SPELL_AURA_APPLIED":
		lf.parseSpellAuraApplied(event)
	case "SPELL_AURA_REMOVED":
		lf.parseSpellAuraRemoved(event)
	case "ENCOUNTER_START":
		lf.parseEncounterStart(event)
	case "ENCOUNTER_END":
		lf.parseEncounterEnd(event)
	}

	//lf.eventCount[timeandevent[1]]++
	//fmt.Printf("%s %s\n", timeandevent[1], lf.eventCount[timeandevent[1]])
}

/*
12/29 15:50:45.875  SPELL_CAST_SUCCESS,
Player-1396-07426A2D, SOURCE GUID
"Vlord-AzjolNerub", SOURCE Name
0x514, source Flags
0x0, source Flags
Creature-0-3769-1228-16363-81270-0000A17826, dest GUID
"Gorian Guardsman", Dest Name
0xa48,
0x0,
51505, SpellID
"Lava Burst",
0x4,
Player-1396-07426A2D,189916,201720,
1481,
4267,
0,
0,
160000,
160000,
3517.38,
7729.62,
631  Player ilvl?????
*/

func (lf *logFile) parseSpellCastSuccess(event *wowEvent) {

	source, _ := lf.currentEncounter.getSourceDestUnit(event)
	s := source.getSpell(event.fields[9:12])
	s.casts++

	source.casts = append(source.casts, unitCast{s.id, s.name, event.eventTime})
}

/*

12/29 15:51:52.146  SPELL_DAMAGE,
Player-1588-07498288, source GUID
"Mazui-Dragonblight", source Name
0x514, source Flags
0x0,   source Flags
Creature-0-3769-1228-16363-85241-000021782A,  dest GUID
"Night-Twisted Brute",  dest Name
0x10a48, dest Flags
0x0,	 dest Flags
108557,  spell ID
"Jab",   spell Name
0x1,     spell School
Creature-0-3769-1228-16363-85241-000021782A, dest GUID again
3575982,  dest heath???
4926606,  ??
0,  ??
0, ??
0, ??
1, ??
0, ??
0, ??
3453.78, ?? location?
7772.71, ??
101,     ??
1349, amount
-1,   overkill
1,    school
0,    resisted
0,    blocked
0,    absrobed
nil,  critical
nil,  glancing
nil,  crushing?
nil   multistrike?

ALSO USE THIS ONE FOR RANGE_DAMAGE

12/29 15:50:45.097  RANGE_DAMAGE,
Player-1396-073916B4,
"Mellyra-AzjolNerub",
0x514,0x0,Creature-0-3769-1228-16363-81270-0000A17826,
"Gorian Guardsman",
0xa48,
0x0,
75,
"Auto Shot",
0x1,
Creature-0-3769-1228-16363-81270-0000A17826,2810859,
3206805,
0,
0,
0,
1,
0,
0,
3498.40,
7743.27,
101,
6697,
-1,
1,
0,
0,
0,
1,
nil,
nil,
nil

*/

func (lf *logFile) parseSpellDamage(event *wowEvent) {

	//if(len(event.fields) < 33) {
	//	log.Print(event.fields)
	//}
	
	source, target := lf.currentEncounter.getSourceDestUnit(event)
	s := source.getSpell(event.fields[9:12])
	
	damage, _ := strconv.Atoi(event.fields[24])
	
	crit := event.fields[30] == "1"
	multi := event.fields[33] == "1"

	s.damageEvents = append(s.damageEvents, spellEvent{event.eventTime, target, damage, 0, false, crit, multi})
	
	/*
	unit, _ := lf.currentEncounter.getSourceDestUnit(event)
	
	spellID, _ := strconv.Atoi(event.fields[9])

	/*
			type spellDamage struct {
			nevents int
			hdamage int
			nhit int
			tdamage int
			ntick int
			ncrit int
			nmulit int
		}


	spellDamage, seen := unit.spells[spellID]

	if !seen {
		spellDamage.SpellName = strings.Trim(event.fields[10], `"`)
		school, _ := strconv.ParseInt(event.fields[11], 0, 0)
		spellDamage.School = school
	}

	spellDamage.Hdamage += damage

	

	//log.Printf("%x",event.fields[33])

	//unit.spells[spellID] = spellDamage
	/*
		//lf.eventCount[event.fields[2]] += damage
		//lf.eventCount[event.fields[2]] += overkill
		//lf.eventCount[event.fields[2]] += absorb
		if(event.fields[33] == "2") {
			spew.Dump(event)
			}
	*/
}

/*
SPELL_PERIODIC_DAMAGE,Player-1388-050C1BAB,"Hetar-Lightbringer",0x514,0x0,Creature-0-3769-1228-16363-78238-0000217824,"Pol",0x10a48,0x0,589,"Shadow Word: Pain",0x20,Creature-0-3769-1228-16363-78238-0000217824,92558417,92748880,0,0,0,3,0,100,4065.60,8474.23,103,3750,-1,32,0,0,0,nil,nil,nil,nil
*/

func (lf *logFile) parseSpellPeriodicDamage(event *wowEvent) {

	source, target := lf.currentEncounter.getSourceDestUnit(event)
	s := source.getSpell(event.fields[9:12])
	
	damage, _ := strconv.Atoi(event.fields[24])
	
	crit := event.fields[30] == "1"
	multi := event.fields[33] == "1"

	s.damageEvents = append(s.damageEvents, spellEvent{event.eventTime, target, damage, 0, true, crit, multi})
}

/*
12/29 15:57:19.753  SPELL_HEAL,
Player-1389-069FF344,
"Novie-Terokkar",
0x514,
0x0,
Player-1588-0764CBDF,
"Almorath-Dragonblight",
0x514,
0x0,
5185,
"Healing Touch",
0x8,
Player-1588-0764CBDF,
268140,
268140,
0,
4460,
0,
0,
131588,
160000,
3550.25,
7960.95,
638,25427,
25427,
0,
nil,
nil

*/
func (lf *logFile) parseSpellHeal(event *wowEvent) {
	
	source, target := lf.currentEncounter.getSourceDestUnit(event)
	s := source.getSpell(event.fields[9:12])
	
	damage, _ := strconv.Atoi(event.fields[24])
	
	crit := event.fields[26] == "1"
	multi := event.fields[27] == "1"

	s.healingEvents = append(s.healingEvents, spellEvent{event.eventTime, target, damage, 0, false, crit, multi})
	/*
			type spellDamage struct {
			nevents int
			hdamage int
			nhit int
			tdamage int
			ntick int
			ncrit int
			nmulit int
		}


	spellHeal, seen := unit.spells[spellID]

	if !seen {
		spellDamage.SpellName = strings.Trim(event.fields[10], `"`)
		school, _ := strconv.ParseInt(event.fields[11], 0, 0)
		spellDamage.School = school
	}

	spellDamage.Hdamage += damage

	if event.fields[33] == "1" {
		spellDamage.Nmulti++

	} else {
		spellDamage.Nhits++
	}

	if event.fields[30] == "1" {
		spellDamage.Ncrit++
	}

	//log.Printf("%x",event.fields[33])

	unit.spells[spellID] = spellDamage
	*/
}
/*
12/29 16:00:03.441  SPELL_ABSORBED,
Creature-0-3769-1228-16363-82519-0002A17824, Source
"Highmaul Conscript", Source
0x10a48, flags
0x0, flags
Player-639-0370246C, Target
"Fluffytank-Xavius", Target
0x40511, flags
0x0, flags
166185, SpellID?
"Rending Slash", Spellname
0x1,  School?
Player-3391-068B0ACD, Absorb provider??
"Sugarcandy-Silvermoon",  Name? 
0x514, flags?
0x0, flags?
17,  Absorb Spell
"Power Word: Shield", Absorb name
0x2,  absorb school?
3538 absorb amouunt?

12/29 15:59:52.398  SPELL_ABSORBED,
Creature-0-3769-1228-16363-82519-0002217824,
"Highmaul Conscript",
0xa48,
0x0,
Player-1313-04554800,
"Prettytough-Wildhammer",
0x40512,
0x0,
Player-1313-04554800,
"Prettytough-Wildhammer",
0x40512,
0x0,
77535,
"Blood Shield",
0x20,
12389

OH LORD THERES A MELEE HIT VERSION WITHOUT THE 3 SPELL FIELDS
*/


func (lf *logFile) parseSpellAbsorbed(event *wowEvent) {
	
	source, target := lf.currentEncounter.getSourceDestUnit(event)
	
	if event.fields[17] != "" { //spell 
		
		s := source.getSpell(event.fields[9:12])
		amount, _ := strconv.Atoi(event.fields[19])
		//credit damage
		s.damageEvents = append(s.damageEvents, spellEvent{event.eventTime, target, 0, amount, false, false, false})
		//now healing
		caster := lf.currentEncounter.getUnitFromFields(event.fields[12:14])
		cs := caster.getSpell(event.fields[16:19])
		cs.healingEvents = append(s.healingEvents, spellEvent{event.eventTime, target, 0, amount, false, false, false})
	} else {  //melee
		s := source.getSpell([]string{"0","Melee","1"})
		amount, _ := strconv.Atoi(event.fields[16])
		//credit damage
		s.damageEvents = append(s.damageEvents, spellEvent{event.eventTime, target, 0, amount, false, false, false})
		//now healing
		caster := lf.currentEncounter.getUnitFromFields(event.fields[9:11])
		cs := caster.getSpell(event.fields[13:16])
		cs.healingEvents = append(s.healingEvents, spellEvent{event.eventTime, target, 0, amount, false, false, false})
	}
	/*
	source, target := lf.currentEncounter.getSourceDestUnit(event)
	
	var err error
	var absorber *wunit
	var amount, spellabsorb,spellcast string
	var spellID,damage int
	var school int64
	if event.fields[17] == "" {//MELEE
	
	
	amount = event.fields[16]
	spellabsorb = event.fields[14]
	spellcast = "Melee"
	school = 1
	
	//credit damage to source unit, CRIT/MULTI?
	spellID = 1
	damage, err = strconv.Atoi(event.fields[16])
	
	} else {
	
	absorber = lf.currentEncounter.getUnitFromFields(event.fields[12:14])
	amount = event.fields[19]
	spellabsorb = event.fields[17]
	spellcast = event.fields[10]
	school,_ = strconv.ParseInt(event.fields[11], 0, 0)
	
	//credit damage to source unit, CRIT/MULTI?
	spellID, _ = strconv.Atoi(event.fields[9])
	damage, err = strconv.Atoi(event.fields[19])
	}

	spellDamage, seen := source.spells[spellID]

	if !seen {
		spellDamage.SpellName = spellcast
		spellDamage.School = school
	}
	
	spellDamage.Adamage += damage
	spellDamage.Nabsorb++  // IS IT A HIT? NO SPELL_PEROIDIC_ABSORB
	source.spells[spellID] = spellDamage
	
	if err != nil {
	//log.Print(spellID)
	//log.Print(err)
	//log.Print(damage)
	for i,a := range event.fields {
		
		log.Printf("[%v]: %v",i,a)
	}

	
	log.Printf("%v's\n %v\n on %v\n absorbs %v\n of %v's\n %v\n\n",absorber.name,spellabsorb,target.name,amount,source.name,spellcast)
	}
    */
}
/*
12/29 15:55:56.520  SWING_DAMAGE_LANDED,
Creature-0-3769-1228-16363-80551-0000A17966,
"Shard of Tectus",
0xa48,
0x0,
Player-639-0370246C,
"Fluffytank-Xavius",
0x40511,
0x0,
Player-639-0370246C,
251661, #10
266280,
4985,
742,
0,
1,
250,
1200,
3559.92,??
7980.04,???
627, # 20
12563,Amount?
-1,
1,
0,
5384,
0,
nil,
nil,
nil,
nil


*/
func (lf *logFile) parseSwingDamageLanded(event *wowEvent) {
	//SAME THING AS SPELL DAMAGE BUT ALL THE FIELDS ARE DIFFERENT.

	source, target := lf.currentEncounter.getSourceDestUnit(event)
	
	s := source.getSpell([]string{"0","Melee","1"})
	damage, _ := strconv.Atoi(event.fields[21])

	
	crit := event.fields[27] == "1"
	multi := event.fields[30] == "1"

	s.damageEvents = append(s.damageEvents, spellEvent{event.eventTime, target, damage, 0, false, crit, multi})

	//log.Print(unit.name)
	/*
	spellDamage, seen := unit.spells[spellID]

	if !seen {
		spellDamage.SpellName = "Melee"
		spellDamage.School = 1
	}

	spellDamage.Hdamage += damage

	if event.fields[30] == "1" {
		spellDamage.Nmulti++

	} else {
		spellDamage.Nhits++
	}

	if event.fields[27] == "1" {
		spellDamage.Ncrit++
	}

	unit.spells[spellID] = spellDamage
 */
}

/*
12/29 16:00:26.133  SPELL_SUMMON,
Player-1588-07498288,
"Mazui-Dragonblight",
0x514,
0x0,
Creature-0-3769-1228-16363-63508-0000217A8A,
"Xuen",
0xa28,
0x0,
123904,
"Invoke Xuen, the White Tiger",
0x8
*/
func (lf *logFile) parseSpellSummon(event *wowEvent) {
	owner, pet := lf.currentEncounter.getSourceDestUnit(event)
	//pet := lf.currentEncounter.getSourceUnit(&wowEvent{"",time.Time{},event.fields[4:]})
	owner.pets = append(owner.pets, pet)
	pet.owner = owner
	//log.Print(owner.pets)
}

/*
12/29 15:54:38.722  SPELL_AURA_APPLIED, eventype
Player-1389-069FF344, source GUID
"Novie-Terokkar", Source Name
0x514, Flags
0x0,   Flags
Player-3391-0681DA9C, Dest GUID
"Grape-Silvermoon",   Dest Name
0x514,  Flags
0x0,   Flags
774,    SpellID
"Rejuvenation", SpellName
0x8,  SpellSchool
BUFF  AuraType
*/
func (lf *logFile) parseSpellAuraApplied(event *wowEvent) {

	source, dest := lf.currentEncounter.getSourceDestUnit(event)
	auraID, _ := strconv.Atoi(event.fields[9])

	key := auraKey{auraID, source}

	aura, seen := dest.auras[key]

	if !seen {
		aura = &unitAura{}
		aura.name = event.fields[10]
		school, _ := strconv.ParseInt(event.fields[11], 0, 0)
		aura.school = school
		aura.events = make([]auraEvent, 0, 10)
		dest.auras[key] = aura
	}

	auraEvent := auraEvent{event.eventTime, 1, 0}

	aura.events = append(aura.events, auraEvent)

}

/*
12/29 15:53:57.972  SPELL_AURA_REMOVED,
Player-1303-0005C92E,
"Stiko-GrimBatol",
0x512,
0x0,
Creature-0-3769-1228-16363-85240-0000217829,
"Night-Twisted Soothsayer",
0xa48,
0x0,
1943,
"Rupture",
0x1,
DEBUFF

*/

func (lf *logFile) parseSpellAuraRemoved(event *wowEvent) {

	source, dest := lf.currentEncounter.getSourceDestUnit(event)
	auraID, _ := strconv.Atoi(event.fields[9])

	key := auraKey{auraID, source}

	aura, seen := dest.auras[key]

	if !seen {
		aura = &unitAura{}
		aura.name = event.fields[10]
		school, _ := strconv.ParseInt(event.fields[11], 0, 0)
		aura.school = school
		aura.events = make([]auraEvent, 0, 10)
		dest.auras[key] = aura
	}

	auraEvent := auraEvent{event.eventTime, 0, 0}

	aura.events = append(aura.events, auraEvent)

}

//12/29 16:04:08.015  ENCOUNTER_START,1719,"Twin Ogron",17,25
func (lf *logFile) parseEncounterStart(event *wowEvent) {

	log.Printf("Encounter %v Start at %v", event.fields[2], event.eventTime)

	lf.currentEncounter.EndTime = event.eventTime
	lf.newEncounter(strings.Trim(event.fields[2], "\""))
	lf.currentEncounter.StartTime = event.eventTime
	lf.currentEncounter.IsBoss = true
	//lf.eventCount = make(eventMap)
}

//12/29 15:57:46.832  ENCOUNTER_END,1722,"Tectus, The Living Mountain",17,25,1
func (lf *logFile) parseEncounterEnd(event *wowEvent) {

	log.Printf("Encounter %v End at %v", event.fields[2], event.eventTime)

	lf.currentEncounter.EndTime = event.eventTime
	lf.newEncounter("trash")
	lf.currentEncounter.StartTime = event.eventTime
}

func (lf *logFile) newEncounter(boss string) {

	if lf.currentEncounter != nil {
		lf.encounters[lf.currentEncounter.StartTime] = lf.currentEncounter
	}
	lf.currentEncounter = new(encounter)
	lf.currentEncounter.Name = boss
	lf.currentEncounter.UnitMap = make(UnitMap)
	//lf.currentEncounter.PlayerMap = make(PlayerMap)

	//spew.Dump("Encounter Start", event)

}

func (u *wunit) getSpell(fields []string) *spell {
	
	
	spellID, _ := strconv.Atoi(fields[0])
	s, ok := u.spells[spellID]
		
	if !ok {
		s = &spell{}
		school, _ := strconv.ParseInt(fields[2],0,0)
		s.id = spellID
		s.name  = fields[1]
		s.school = school
		s.damageEvents = make([]spellEvent, 0, 5)
		s.healingEvents = make([]spellEvent, 0, 5)
		u.spells[spellID] = s
	}
	return s
}

func (e *encounter) getSourceDestUnit(event *wowEvent) (*wunit, *wunit) {
    
	return e.getUnitFromFields(event.fields[1:3]),e.getUnitFromFields(event.fields[5:7])
}

func (e *encounter) getUnitFromFields(fields []string) *wunit {

	GUID := fields[0]
	Name := fields[1]

	unit, exists := e.UnitMap[GUID]

	if !exists {
		unit = &wunit{GUID, Name, false, 0, 0, nil, nil, nil, nil, nil}
		unit.spells = make(unitSpells)
		unit.pets = make([]*wunit, 0, 5)
		unit.auras = make(unitAuras)
		unit.casts = make([]unitCast, 0, 50)
		if strings.HasPrefix(GUID, "Player") {
			unit.isPlayer = true
		}
	e.UnitMap[GUID] = unit
	}
	return unit
}