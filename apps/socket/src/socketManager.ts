import { z } from "zod";
import {
	InitMessageSchema,
	MessageSchema,
	SubscribeMessageSchema,
	UnsubscribeMessageSchema,
} from "./schemas";
import { StateManager } from "./stateManager";
import { CustomWebSocket, MessageType } from "./types";
import { verifyAndGetUser } from "./utils";

export class WSManager {
	private static instance: WSManager | null = null;
	private stateManager: StateManager;

	private constructor() {
		this.stateManager = StateManager.getInstance();
	}

	public static getInstance(): WSManager {
		if (!WSManager.instance) {
			WSManager.instance = new WSManager();
		}
		return WSManager.instance;
	}

	// Prevent cloning
	public clone(): never {
		throw new Error("WSManager is a singleton and cannot be cloned");
	}

	public async handleConnection(socket: CustomWebSocket) {
		socket.on("message", async (message: string) => {
			try {
				const parsedMessage = JSON.parse(message);
				const validatedMessage = MessageSchema.parse(parsedMessage);

				await this.handleMessage(socket, validatedMessage);
			} catch (error) {
				socket.send(
					JSON.stringify({ type: "ERROR", message: "Invalid message format" })
				);
			}
		});
	}

	private async handleMessage(
		socket: CustomWebSocket,
		message: z.infer<typeof MessageSchema>
	) {
		switch (message.type) {
			case MessageType.INIT:
				await this.handleInit(socket, message);
				break;
			case MessageType.SUBSCRIBE:
				await this.handleSubscribe(socket, message);
				break;
			case MessageType.UNSUBSCRIBE:
				await this.handleUnsubscribe(socket, message);
				break;
		}
	}

	private async handleInit(
		socket: CustomWebSocket,
		message: z.infer<typeof InitMessageSchema>
	) {
		try {
			const user = await verifyAndGetUser(message.token);

			this.stateManager.addUser(user.id, socket, user.role);
			socket.userId = user.id;
			socket.userRole = user.role;

			socket.send(JSON.stringify({ type: "INIT_SUCCESS" }));
		} catch (error) {
			// @ts-ignore
			socket.send(JSON.stringify({ type: "ERROR", message: error.message }));
		}
	}

	private async handleSubscribe(
		socket: CustomWebSocket,
		message: z.infer<typeof SubscribeMessageSchema>
	) {
		if (!socket.userId) {
			socket.send(
				JSON.stringify({ type: "ERROR", message: "Not initialized" })
			);
			return;
		}

		this.stateManager.addSubscription(
			message.canteenId,
			message.screen,
			socket.userId
		);
		socket.send(JSON.stringify({ type: "SUBSCRIBE_SUCCESS" }));
	}

	private async handleUnsubscribe(
		socket: CustomWebSocket,
		message: z.infer<typeof UnsubscribeMessageSchema>
	) {
		if (!socket.userId) {
			socket.send(
				JSON.stringify({ type: "ERROR", message: "Not initialized" })
			);
			return;
		}

		this.stateManager.removeSubscription(
			message.canteenId,
			message.screen,
			socket.userId
		);
		socket.send(JSON.stringify({ type: "UNSUBSCRIBE_SUCCESS" }));
	}
}
