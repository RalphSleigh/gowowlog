Gowowlog - A World of Warcraft Combat Log Parser
======

Gowowlog is a combat log parser for WOW written in Go/AngularJS. Currently will display damage done and auras gained/lost. Created because I wanted to see things in more detail than skada in real time, but many log parsing websites tend to be very slow at peak times. Still very much a work in progress.

To use:

1. Do whatever magic required to download/install, may/may not be "go get githib.com/ralphsleigh/gowowlog && go install githib.com/ralphsleigh/gowowlog"
2. Make sure you have advanced combat logging turned on in WoW options -> system -> network
3. Run gowowlog -logfile=/path/to/your/logfile
4. Open http://localhost:8081/index.html in your web browser.

Should look like [this](http://i.imgur.com/JPG3lzL.png)

If you don't get the interface, try specifying -webroot to the included webfiles directory. Its also helpful if the icons directory is writeable as a cache.

Known issues:

* Some pets are unaccounted for and need owners.
* Spec detection for a few specs is not working. No attempt at the moment to diff Glad/Prot Warriors
* Many many ignored errors, leading to panics. concurrent map access is undefined, should fix that.
* Healing does not match {{log site}}, need to look into overhealing

Todos:

* Healing
* Better Aura graphs.
* Interrupts/Problems 

Not going todos currently:

* Anything that requires centralised log data, e.g ranks, comparative performance.
* Log uploaders.
* Lots of making it user friendly.

> Ralph Sleigh @Ralphsleigh Windweaver@EU-Xavius

