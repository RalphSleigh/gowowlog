damageApp.directive('auraMap', function() {
  return {
    restrict: 'AE',
    template: '<canvas width="1000" height="100">',
    link: function(scope, elem, attrs) {
			var X = function(x) {
				return (x*1000)/scope.unit.Duration;
			}
			
			if(!scope.unit)return;

			
			
			
			var maxStacks = 0;
			for(var i = 0; i < scope.aura.Events.length; i++) {
			maxStacks = Math.max(scope.aura.Events[i].Stacks,maxStacks);
				
			}
			
			var opacity = 0.7/maxStacks;
			
			c = $(elem.find("canvas")[0]);
			c.height(c.closest('td').height());
			cx = c[0].getContext("2d");
			cx.fillStyle = "rgba(255,0,0,"+opacity+")";
			
			var prev = {Time:0,Stacks:0, Amount:0};
			
			for(var i = 0; i < scope.aura.Events.length; i++) {
				var current = scope.aura.Events[i];
				if(current.Stacks > prev.Stacks) {
					var done = false;
					for(var j = i + 1; j < scope.aura.Events.length; j++) {
						var end = scope.aura.Events[j];
						if(end.Stacks < current.Stacks){
							cx.fillRect(X(current.Time), 0, X(end.Time) - X(current.Time), 100);
							done = true;
							break;
						}
					}
					if(!done) {
						cx.fillRect(X(current.Time), 0, X(scope.unit.Duration) - X(current.Time), 100);
					}
				}
				prev = current
			}
		
			
			/*
			prev := auraEvent{e.StartTime,0,0}

	
	for i,event := range a.events {
			log.Printf("Event at %v, stacks: %v, prev: %v",e.GetX(event.time), event.stacks,prev.stacks)
			if event.stacks > prev.stacks {
				done := false
				for _,endEvent := range a.events[i+1:] {
					if endEvent.stacks <= prev.stacks {
						log.Print("Drawing rectange")
						s.Rect(e.GetX(event.time), 0, e.GetX(endEvent.time) - e.GetX(event.time), 100,s.RGBA(255,0,0,0.8/maxStacks)+";stroke:none")
						done = true
						break
					}
				}
				if !done {
					log.Print("Drawing rectange")
					s.Rect(e.GetX(event.time), 0, e.GetX(e.EndTime) - e.GetX(event.time), 100,s.RGBA(255,0,0,0.8/maxStacks)+";stroke:none")
				}
			}
		prev = event
		//s.Circle(e.GetX(event.time), 50, event.stacks * 10, "fill:none;stroke:black")
		}
		*/
			
			//ctx.fillStyle = "#FF0000";
			//ctx.fillRect(10,10,150,80);
			eval();
			
    }
  };
});