package main

import (
	"strings"
	//"log"
)

const (
	SPELL_DAMAGE = iota
	SPELL_PERIODIC_DAMAGE
)

const (
	CLASS_UNKNOWN = iota
	CLASS_DEATH_KNIGHT
	CLASS_DRUID
	CLASS_HUNTER
	CLASS_MAGE
	CLASS_MONK
	CLASS_PALADIN
	CLASS_PRIEST
	CLASS_ROGUE
	CLASS_SHAMEN
	CLASS_WARLOCK
	CLASS_WARRIOR
)

const (
	SPEC_DEATH_KNIGHT_BLOOD = iota
	SPEC_DEATH_KNIGHT_FROST
	SPEC_DEATH_KNIGHT_UNHOLY
	SPEC_DRUID_BALANCE
	SPEC_DRUID_FERAL
	SPEC_DRUID_GUARDIAN
	SPEC_DRUID_RESTORATION
	SPEC_HUNTER_BEAST_MASTERY
	SPEC_HUNTER_MARKSMANSHIP
	SPEC_HUNTER_SURVIVAL
	SPEC_MAGE_ARCANE
	SPEC_MAGE_FIRE
	SPEC_MAGE_FROST
	SPEC_MONK_BREWMASTER
	SPEC_MONK_MISTWEAVER
	SPEC_MONK_WINDWALKER
	SPEC_PALADIN_HOLY
	SPEC_PALADIN_PROTECTION
	SPEC_PALADIN_RETRIBUTION
	SPEC_PRIEST_DESCIPLINE
	SPEC_PRIEST_HOLY
	SPEC_PRIEST_SHADOW
	SPEC_ROGUE_ASSASSINATION
	SPEC_ROGUE_COMBAT
	SPEC_ROGUE_SUBTLETY
	SPEC_SHAMEN_ELEMENTAL
	SPEC_SHAMEN_ENHANCEMENT
	SPEC_SHAMEN_RESTORATION
	SPEC_WARLOCK_AFFLICTION
	SPEC_WARLOCK_DEMONOLOGY
	SPEC_WARLOCK_DESTRUCTION
	SPEC_WARRIOR_ARMS
	SPEC_WARRIOR_FURY
	SPEC_WARRIOR_PROTECTION
)

type classString struct {
	Display  string
	CSSClass string
}
type classStrings map[int]classString

func GetClassStrings() classStrings {

	s := make(classStrings)

	s[CLASS_UNKNOWN] = classString{"Creature", "c"}
	s[CLASS_DEATH_KNIGHT] = classString{"Death Knight", "deathknight"}
	s[CLASS_DRUID] = classString{"Druid", "druid"}
	s[CLASS_HUNTER] = classString{"Hunter", "hunter"}
	s[CLASS_MAGE] = classString{"Mage", "mage"}
	s[CLASS_MONK] = classString{"Monk", "monk"}
	s[CLASS_PALADIN] = classString{"Paladin", "paladin"}
	s[CLASS_PRIEST] = classString{"Priest", "priest"}
	s[CLASS_ROGUE] = classString{"Rogue", "rogue"}
	s[CLASS_SHAMEN] = classString{"Shamen", "shamen"}
	s[CLASS_WARLOCK] = classString{"Warlock", "warlock"}
	s[CLASS_WARRIOR] = classString{"Warrior", "warrior"}

	return s
}

func (e *encounter) GetPlayerClassSpec(lf *logFile) {

	for unitid, unit := range e.UnitMap {
		if !strings.HasPrefix(unitid, "Player") {
			continue
		}
		for spellid, _ := range unit.spells { //ALMIGHT SWITCH HACK TODO REPLACE WITH SOME PARSED FILE
			switch spellid { //This is not  actually enough cause some hunters suck...
			case 49998: //death strike (NOT UNIQUE)
				unit.Class = CLASS_DEATH_KNIGHT
				unit.Spec = SPEC_DEATH_KNIGHT_BLOOD
			case 49143: //frost strike
				unit.Class = CLASS_DEATH_KNIGHT
				unit.Spec = SPEC_DEATH_KNIGHT_FROST
			case 85948: //festering strike
				unit.Class = CLASS_DEATH_KNIGHT
				unit.Spec = SPEC_DEATH_KNIGHT_UNHOLY
			case 78674: //starsurge
				unit.Class = CLASS_DRUID
				unit.Spec = SPEC_DRUID_BALANCE
			case 1079: //rip
				unit.Class = CLASS_DRUID
				unit.Spec = SPEC_DRUID_FERAL
			case 18562, 33763: //swiftmend, lifebloom
				unit.Class = CLASS_DRUID
				unit.Spec = SPEC_DRUID_RESTORATION
			case 124991: //natures vigil (talent not unique)
				unit.Class = CLASS_DRUID
				unit.Spec = SPEC_DRUID_RESTORATION
			case 77767: //cobra shot (not unique)
				unit.Class = CLASS_HUNTER
				unit.Spec = SPEC_HUNTER_BEAST_MASTERY
			case 19434: //aimed shot
				unit.Class = CLASS_HUNTER
				unit.Spec = SPEC_HUNTER_MARKSMANSHIP
			case 118253: //serpent sting
				unit.Class = CLASS_HUNTER
				unit.Spec = SPEC_HUNTER_SURVIVAL
			case 30451: //arcane blast
				unit.Class = CLASS_MAGE
				unit.Spec = SPEC_MAGE_ARCANE
			case 11366: //pyroblast
				unit.Class = CLASS_MAGE
				unit.Spec = SPEC_MAGE_FIRE
			case 116: //frostbolt
				unit.Class = CLASS_MAGE
				unit.Spec = SPEC_MAGE_FROST
			case 121253: //keg smash
				unit.Class = CLASS_MONK
				unit.Spec = SPEC_MONK_BREWMASTER
			case 116670: //uplift
				unit.Class = CLASS_MONK
				unit.Spec = SPEC_MONK_MISTWEAVER
			case 117418: //fists of fury
				unit.Class = CLASS_MONK
				unit.Spec = SPEC_MONK_WINDWALKER
			case 25912, 82327: //holy shock, holy radiance
				unit.Class = CLASS_PALADIN
				unit.Spec = SPEC_PALADIN_HOLY
			case 53600: // SotR
				unit.Class = CLASS_PALADIN
				unit.Spec = SPEC_PALADIN_PROTECTION
			case 53385: //divine storm
				unit.Class = CLASS_PALADIN
				unit.Spec = SPEC_PALADIN_RETRIBUTION
			case 47666, 81700, 47750: //penance, archangel, more penance
				unit.Class = CLASS_PRIEST
				unit.Spec = SPEC_PRIEST_DESCIPLINE
			case 126135, 139, 34861: //lightwell, renew, circle of healing
				unit.Class = CLASS_PRIEST
				unit.Spec = SPEC_PRIEST_HOLY
			case 8092: //mind blast
				unit.Class = CLASS_PRIEST
				unit.Spec = SPEC_PRIEST_SHADOW
			case 111240: //dispatch
				unit.Class = CLASS_ROGUE
				unit.Spec = SPEC_ROGUE_ASSASSINATION
			case 1752: //sinister  strike
				unit.Class = CLASS_ROGUE
				unit.Spec = SPEC_ROGUE_COMBAT
			case 16511: //hemmorage
				unit.Class = CLASS_ROGUE
				unit.Spec = SPEC_ROGUE_SUBTLETY
			case 170379:
				unit.Class = CLASS_SHAMEN
				unit.Spec = SPEC_SHAMEN_ELEMENTAL
			case 60103: //lava lash
				unit.Class = CLASS_SHAMEN
				unit.Spec = SPEC_SHAMEN_ENHANCEMENT
			case 974, 108280: //Earth shield, HTT
				unit.Class = CLASS_SHAMEN
				unit.Spec = SPEC_SHAMEN_RESTORATION
			case 27:
				unit.Class = CLASS_WARLOCK
				unit.Spec = SPEC_DEATH_KNIGHT_BLOOD
			case 686: //shadow bolt
				unit.Class = CLASS_WARLOCK
				unit.Spec = SPEC_WARLOCK_DEMONOLOGY
			case 116858: //chaos bolt
				unit.Class = CLASS_WARLOCK
				unit.Spec = SPEC_WARLOCK_DESTRUCTION
			case 167105: //colossus smash
				unit.Class = CLASS_WARRIOR
				unit.Spec = SPEC_WARRIOR_ARMS
			case 100130: //wild strike
				unit.Class = CLASS_WARRIOR
				unit.Spec = SPEC_WARRIOR_FURY
			case 23922: //shield slam
				unit.Class = CLASS_WARRIOR
				unit.Spec = SPEC_WARRIOR_PROTECTION
			}
		}
		if unit.Class == 0 {
			unit.Class = CLASS_WARRIOR
			unit.Spec = SPEC_WARRIOR_PROTECTION
		}
	}
}

//deathknight

//druid

//hunter

//mage

//monk
//cm[100780] = CLASS_MONK //jab
//paladin

//priest

//rogue

//shamen

//warlock

//warrior
