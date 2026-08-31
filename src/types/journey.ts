export type JourneyMilestoneAction = {
  id: string;
  title: string;
  action_type?: string | null;
  status?: string | null;
};

export type JourneyMilestone = {
  id: string;
  stage_key: string;
  position: number;
  title: string;
  target_role?: string | null;
  description?: string | null;
  target_date?: string | null;
  status?: string | null;
  progress?: number | null;
  job_milestone_actions?: JourneyMilestoneAction[] | null;
};

export type ActiveJourney = {
  id: string;
  title: string;
  summary?: string | null;
  current_milestone_id?: string | null;
  job_milestones?: JourneyMilestone[] | null;
};
