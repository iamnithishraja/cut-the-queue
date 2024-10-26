import WebSocket from "ws";
export type devices = {
  socket: WebSocket;
  id: string;
};
export type menuItemType = {
  id: String;
  name: String;
  //   description?: string,
  //   itemImage?: string,
  //   price : number,
  //   isVegetarian: Boolean
  avilableLimit: number | null;
  //   status?: string,
  //   canteenId: string,
  //   orders?: []
};
