export interface ContainerEvent {
  Type: string;
  Action: string;
  Actor: {
    ID: string;
    Attributes: {
      agent_id: string;
      image: string;
      name: string;
      sandbox_id: string;
    };
  };
  scope: string;
  time: number;
}
