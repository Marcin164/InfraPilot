export interface Dashboard {
  id: string;
  name: string;
  userId: string;
  cards: DashboardCard[];
}

export interface DashboardCard {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  component: string;
}
