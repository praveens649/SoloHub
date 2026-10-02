const GOAL_KEY = "productivity_goals";

export interface ProductivityGoals {
  commits: number;
  pullRequests: number;
  issues: number;
}

const DEFAULT_GOALS: ProductivityGoals = {
  commits: 10,
  pullRequests: 1,
  issues: 1,
};

export async function getGoals(): Promise<ProductivityGoals> {
  const result = await chrome.storage.local.get( 
    GOAL_KEY
  );

  return {
    ...DEFAULT_GOALS,
    ...(result[GOAL_KEY] as Partial<ProductivityGoals> | undefined),
  };
}

export async function setGoals(
  goals: ProductivityGoals
) {
  await chrome.storage.local.set({
    [GOAL_KEY]: goals,
  });
}