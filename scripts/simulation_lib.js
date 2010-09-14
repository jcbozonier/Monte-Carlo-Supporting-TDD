var NextQueue = function(report)
{
  this._story_queue = [];
};    
NextQueue.prototype.report_to = function(report)
{
  report.that_backlog_size_is(this._story_queue.length);
};
NextQueue.prototype.pull_next_story_to = function(queue)
{
  if(this._story_queue.length == 0) return;
  
  var next_story = this._story_queue.pop();
  
  if(next_story == null) return;
  queue.add(next_story);
};
NextQueue.prototype.add_as_top_priority = function(story)
{
  if(story == null) return;
  this._story_queue.push(story);
};

var DevelopmentTeam = function(minimum_velocity, max_velocity)
{
  this._minimum_velocity = minimum_velocity;
  this._velocity = minimum_velocity;
  this._max_velocity = max_velocity;
  this._completed_stories = [];
  this._current_story = null;
  this._current_work_remaining = 0;
  this._current_iteration = 0;
};
DevelopmentTeam.prototype.work_from = function(queue)
{    
  this._current_iteration += 1;
  
  for(var i=0; i < this._velocity; i++)
  {
	if(this._current_story == null)
	  queue.pull_next_story_to(this);
	
	this._current_work_remaining -= 1;
	
	if(this._current_work_remaining <= 0)
	{
	  if(this._current_story != null)
		this._completed_stories.push(this._current_story);
	  queue.pull_next_story_to(this);
	}
  }
  
  this._ramp_up_velocity();
};
DevelopmentTeam.prototype._ramp_up_velocity = function()
{
  // Using the logistic function to define a learning curve.
  //this._velocity = this._max_velocity/(1+exp(-(this._current_iteration-4)/3))
  
  //using learning curve shape documented here: http://en.m.wikipedia.org/wiki/Learning_curves
  //thanks to Robert Ream
  this._velocity = this._max_velocity - (this._max_velocity - this._minimum_velocity) * Math.pow(this._current_iteration, -(1/3));
};
DevelopmentTeam.prototype.add = function(story)
{
  this._current_story = story;
  this._current_work_remaining = story.size; 
}
DevelopmentTeam.prototype.move_finished_stories_to = function(queue)
{
  for(var index in this._completed_stories)
  {
    var completed_story = this._completed_stories[index];
    queue.add(completed_story);
  }
  
  this._completed_stories = [];
};

var DoneQueue = function(defect_to_story_point_ratio_per_iteration)
{
  this._failure_rate = defect_to_story_point_ratio_per_iteration;
  this._story_queue = [];
};
DoneQueue.prototype.add = function(story)
{
  if(story == null) return;
  this._story_queue.push(story);
};
DoneQueue.prototype.test_stories_and_pull_failures_to = function(queue)
{
  var queue_length = this._story_queue.length;
  
  for(var i = 0; i < queue_length; i++)
  {
    var random_number = Math.random();
    
    if(random_number <= this._failure_rate)
    {
      var story_with_defect = this._story_queue[i];
      var bug = new BugStory();
      // Use a probability distribution for bug size that more closely matches our reality @ work.
      bug.size = story_with_defect.size;
      
      queue.add(bug);
    }
  }
};
DoneQueue.prototype.report_to = function(report)
{
  var value_sum = 0;
  for(var i=0; i<this._story_queue.length; i++)
  {
    value_sum += this._story_queue[i].value;
  }
  report.total_value_delivered_is(value_sum);
  report.total_story_count_delivered_is(this._story_queue.length);
};

var BugQueue = function()
{
  this._story_queue = [];
  this._total_bug_count = 0;
};
BugQueue.prototype.add = function(story)
{
  if(story == null) return;
  
  this._total_bug_count = this._total_bug_count + 1;
  this._story_queue.push(story);
};
BugQueue.prototype.prioritize_and_move_bugs_to = function(queue)
{
  var story = this._story_queue.pop();
  
  while(story != null)
  {
	queue.add_as_top_priority(story);
	story = this._story_queue.pop();
  }
};
BugQueue.prototype.report_to = function(report)
{
  report.total_bugs_found_are(this._total_bug_count);
};

var UserStory = function()
{
};
UserStory.prototype.size = 0;
UserStory.prototype.value = 1;

var BugStory = function()
{
};
BugStory.prototype.size = 0;
BugStory.prototype.value = .1;

var Customer = function(story_size_distribution)
{
  this._story_size_distribution = story_size_distribution;
  this._deliver_this_many_stories_each_iteration = 2;
};
Customer.prototype.deliver_new_stories_to = function(queue)
{
  for(var i=0; i<this._deliver_this_many_stories_each_iteration; i++)
  {
	var story = this._get_next_story();
	queue.add_as_top_priority(story);
  }
};
Customer.prototype._get_next_story = function()
{
  var max_distribution_index = this._story_size_distribution.length - 1;
  
  //pick a random number between 0 and max_distribution_index
  var index_to_use = Math.round(Math.random() * max_distribution_index);
  var story = new UserStory();
  story.size = this._story_size_distribution[index_to_use];
  
  return story;
};

var DevelopmentProcess = function(customer, next_queue, development_team, done_queue, bug_queue, report)
{
  this._customer = customer;
  this._next_queue = next_queue;
  this._development_team = development_team;
  this._done_queue = done_queue;
  this._bug_queue = bug_queue;
  this._report = report;
};
DevelopmentProcess.prototype.iterate = function()
{
  this._report.next_iteration();
  this._next_queue.report_to(this._report);
  this._done_queue.report_to(this._report);
  this._bug_queue.report_to(this._report);

  this._customer.deliver_new_stories_to(this._next_queue);
  this._development_team.work_from(this._next_queue);
  this._development_team.move_finished_stories_to(this._done_queue);
  this._done_queue.test_stories_and_pull_failures_to(this._bug_queue);
  this._bug_queue.prioritize_and_move_bugs_to(this._next_queue);
};

simulation_lib_LOADED = true;