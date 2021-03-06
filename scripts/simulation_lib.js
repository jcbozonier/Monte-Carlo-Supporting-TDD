var ProductBacklog = function(report)
{
  this._story_queue = [];
};
ProductBacklog.prototype.pull_next_story_to = function(queue)
{
  if(this._story_queue.length == 0) return;
  
  var next_story = this._story_queue.pop();
  
  if(next_story == null) return;
  queue.add(next_story);
};
ProductBacklog.prototype.add_bug = function(story)
{
  if(story == null) return;
  
  var queued_stories = this._story_queue;
  this._story_queue = new Array(queued_stories.length + 1);
  
  var index_for_bug = Math.ceil(Math.random() * queued_stories.length);
  
  for(var i=queued_stories.length; i >= 0; i--)
  {
    if(index_for_bug == i)
    {
      this._story_queue[i] = story;
    }
    else
    {
      var old_story = queued_stories.pop();
      if(old_story == null) throw "A null should not happen here!";
      
      this._story_queue[i] = old_story
    }
  }
};

var DevelopmentTeam = function(story_size_distribution)
{
  this._story_size_distribution = story_size_distribution;
  this._completed_stories = [];
  this._current_story = null;
  this._current_work_remaining = 0;
  this._current_iteration_id = 0;
};
DevelopmentTeam.prototype.work_from = function(queue)
{    
  this._current_iteration_id += 1;
  
  for(var i=0; i < this._iteration_budget; i++)
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
  //using learning curve shape documented here: http://en.m.wikipedia.org/wiki/Learning_curves
  //thanks to Robert Ream
  this._iteration_budget = this._max_velocity - (this._max_velocity - this._minimum_velocity) * Math.pow(this._current_iteration_id, - (1/3));
};
DevelopmentTeam.prototype.add = function(story)
{
  var max_distribution_index = this._story_size_distribution.length - 1;  
  var value_index = Math.round(Math.random() * max_distribution_index);
  story.size = this._story_size_distribution[value_index];

  this._current_story = story;
  this._current_work_remaining = story.size; 
}
DevelopmentTeam.prototype.deliver_finished_stories_to = function(queue)
{
  var story = this._completed_stories.pop();
  
  while(story != null)
  {
    queue.add(story);
    story = this._completed_stories.pop();
  }
  
  this._completed_stories = [];
};
DevelopmentTeam.prototype.velocity_begins_at = function(value)
{
  this._minimum_velocity = value;
  this._iteration_budget = value;
};
DevelopmentTeam.prototype.maximum_possible_velocity_is = function(value)
{
  this._max_velocity = value;
};

var EndUsers = function(random_sample_generator)
{
  this._story_queue = [];
  this._random_sample_generator = random_sample_generator;
};
EndUsers.prototype.add = function(story)
{
  if(story == null) return;
  this._story_queue.push(story);
};
EndUsers.prototype.test_stories_and_report_failures_to = function(queue)
{
  // This could be _much_ better...
  // Thinking I may be missing an object here.
  // All I really need is to tell some object
  // how many stories I have so it can compute
  // the number of bugs I should have.
  var queue_length = this._story_queue.length;
  
  for(var i = queue_length-1; i >= 0; i--)
  {
    var random_number = Math.random();
    
    if(random_number <= this._failure_rate)
    {      
      var bug = new BugStory();
      bug.value = 0;
      bug.size = this._random_sample_generator.next_value();
      
      queue.add(bug);
    }
  }
};
EndUsers.prototype.report_to = function(report)
{
  var value_sum = 0;
  for(var i=this._story_queue.length-1; i >= 0; i--)
  {
    value_sum += this._story_queue[i].value;
  }
  report.total_value_delivered_is(value_sum);
};
EndUsers.prototype.find_this_many_bugs_per_story_per_iteration = function(value)
{
  this._failure_rate = value
};

var DiscreteDistribution = function()
{
};
DiscreteDistribution.prototype.use_these_as_samples = function(samples)
{
  this._sample_distribution = samples;
};
DiscreteDistribution.prototype.next_value = function()
{
  var random_index = Math.floor(Math.random() * this._sample_distribution.length);
  var chosen_element = this._sample_distribution[random_index];
  
  return chosen_element;
};

var SupportTeam = function()
{
  this._story_queue = [];
  this._total_bug_count = 0;
};
SupportTeam.prototype.add = function(story)
{
  if(story == null) return;
  
  this._total_bug_count = this._total_bug_count + 1;
  this._story_queue.push(story);
};
SupportTeam.prototype.prioritize_and_move_bugs_to = function(queue)
{
  var story = this._story_queue.pop();
  
  while(story != null)
  {
    queue.add_bug(story);
    story = this._story_queue.pop();
  }
};
SupportTeam.prototype.report_to = function(report)
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
BugStory.prototype.value = 0;

var BusinessCustomers = function()
{
};
BusinessCustomers.prototype.deliver_new_stories_to = function(queue)
{
  var stories_to_deliver = Math.ceil(Math.random() * 12);
  for(var i=0; i<stories_to_deliver; i++)
  {
    var story = this._get_next_story();
    queue.add_bug(story);
  }
};
BusinessCustomers.prototype._get_next_story = function()
{
  var story = new UserStory();
  story.value = 1;
  return story;
};

var DevelopmentProcess = function(business_customer, product_backlog, development_team, end_users, bug_queue, report)
{
  this._business_customer = business_customer;
  this._product_backlog = product_backlog;
  this._development_team = development_team;
  this._end_users = end_users;
  this._bug_queue = bug_queue;
  this._report = report;
};
DevelopmentProcess.prototype.iterate = function()
{
  this._report.next_iteration();

  this._business_customer.deliver_new_stories_to(this._product_backlog);
  this._development_team.work_from(this._product_backlog);
  this._development_team.deliver_finished_stories_to(this._end_users);
  this._end_users.test_stories_and_report_failures_to(this._bug_queue);
  this._bug_queue.prioritize_and_move_bugs_to(this._product_backlog);
  
  this._end_users.report_to(this._report);
};

var Report = function()
{
  this._iteration = 0;
  this._iteration_ids = [];
  this._chart = null;
  this._color_name = 'black';
};
Report.prototype.total_value_delivered_is = function(value_delivered)
{
  this._chart.plot(this._iteration, value_delivered, this._color_name);
};
Report.prototype.plot_results_in_color = function(color_name)
{
  this._color_name = color_name;
};
Report.prototype.plot_results_on = function(chart)
{
  this._chart = chart;
};
Report.prototype.next_iteration = function()
{
  this._iteration_ids.push(this._iteration++);
  this._chart.set_x_labels(this._iteration_ids);
};

var DevelopmentProcessFactory = function(tdd_comparison_chart)
{
  this._tdd_comparison_chart = tdd_comparison_chart;
};
DevelopmentProcessFactory.prototype.chart_
DevelopmentProcessFactory.prototype.create_tdd_development = function (simulation_settings)
{
  var tdd_development_team_report = new Report();
  tdd_development_team_report.plot_results_in_color('green');
  tdd_development_team_report.plot_results_on(this._tdd_comparison_chart);
  
  var business_customers = new BusinessCustomers();
  
  var product_backlog = new ProductBacklog();
  
  var development_team = new DevelopmentTeam(simulation_settings.story_size_distribution);
  development_team.velocity_begins_at(simulation_settings.min_tdd_velocity);
  development_team.maximum_possible_velocity_is(simulation_settings.max_tdd_velocity);
  
  var random_bug_size_generator = new DiscreteDistribution();
  random_bug_size_generator.use_these_as_samples(simulation_settings.bug_size_distribution);
  
  var end_users = new EndUsers(random_bug_size_generator);
  end_users.find_this_many_bugs_per_story_per_iteration(simulation_settings.tdd_defect_ratio);
  
  var support_team = new SupportTeam();
  
  var development_process = new DevelopmentProcess(business_customers, product_backlog, development_team, end_users, support_team, tdd_development_team_report);
  
  return development_process;
};
DevelopmentProcessFactory.prototype.create_std_development = function(simulation_settings)
{
  var standard_development_team_report = new Report();
  standard_development_team_report.plot_results_in_color('red');
  standard_development_team_report.plot_results_on(this._tdd_comparison_chart);
  
  var business_customers = new BusinessCustomers();
  var product_backlog = new ProductBacklog();
  
  var development_team = new DevelopmentTeam(simulation_settings.story_size_distribution);
  development_team.velocity_begins_at(simulation_settings.min_tdd_velocity);
  development_team.maximum_possible_velocity_is(simulation_settings.max_tdd_velocity);
  
  var random_bug_size_generator = new DiscreteDistribution();
  random_bug_size_generator.use_these_as_samples(simulation_settings.bug_size_distribution);
  
  var end_users = new EndUsers(random_bug_size_generator);
  end_users.find_this_many_bugs_per_story_per_iteration(simulation_settings.std_defect_ratio);
  
  var support_team = new SupportTeam();
  
  var development_process = new DevelopmentProcess(business_customers, product_backlog, development_team, end_users, support_team, standard_development_team_report);
  
  return development_process;
};

var SimulatedDevelopmentTeams = function(simulation_settings)
{
  this._development_teams = [];
  this._simulation_settings = simulation_settings;
};
SimulatedDevelopmentTeams.prototype.create_tdd_development_teams_using = function(development_process_factory)
{
  for(var tdd_teams_to_add = this._simulation_settings.teams_to_simulate; tdd_teams_to_add > 0; tdd_teams_to_add--)
  {
    var tdd_developmental_process = development_process_factory.create_tdd_development(this._simulation_settings)
    this._development_teams.push(tdd_developmental_process);
  }
};
SimulatedDevelopmentTeams.prototype.create_standard_development_teams_using = function(development_process_factory)
{
  for(var std_teams_to_add = this._simulation_settings.teams_to_simulate; std_teams_to_add > 0; std_teams_to_add--)
  {
    var std_developmental_process = development_process_factory.create_std_development(this._simulation_settings)
    this._development_teams.push(std_developmental_process);
  }
};
SimulatedDevelopmentTeams.prototype.iterate = function()
{
  for(var team_index in this._development_teams)
  {
    this._development_teams[team_index].iterate();
  }
};

var Chart = function()
{
  this._data = [];
};
Chart.prototype.plot = function(x, y, color)
{
  this._data.push([x, y, color, 'Iteration:' + x +' Value:' + Math.floor(y)]);
}
Chart.prototype.set_x_labels = function(labels)
{
  this._x_labels = labels;
};
Chart.prototype.draw_chart_to = function(canvas_id)
{
  var sg = new RGraph.Scatter(canvas_id, this._data);
  sg.Set('chart.background.barcolor1','rgba(255,255,255,1)');
  sg.Set('chart.background.barcolor2', 'rgba(255,255,255,1)');
  sg.Set('chart.grid.color', 'rgba(238,238,238,1)');
  sg.Set('chart.ticksize', 2);
  sg.Set('chart.tickmarks', 'cross');
  sg.Set('chart.gutter', 35);
  sg.Set('chart.xmax', this._x_labels.length); // Important!
  sg.Draw();
};
