import type { StateCreator, StoreMutators } from 'zustand';
import { AppStoreState } from '..';

// Socket message interface
export interface SocketMessage {
	id: string;
	type: string;
	data: any;
	timestamp: string;
	userId?: string;
}

// Socket state interface
export interface SocketState {
	isConnected: boolean;
	connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
	messages: SocketMessage[];
	lastMessage: SocketMessage | null;
	error: string | null;
	reconnectAttempts: number;
	maxReconnectAttempts: number;
	socketUrl: string;
	roomId?: string;
}

// Socket actions interface
export interface SocketActions {
	connect: (url: string, roomId?: string) => void;
	disconnect: () => void;
	sendMessage: (type: string, data: any) => void;
	addMessage: (message: SocketMessage) => void;
	clearMessages: () => void;
	setConnectionStatus: (status: SocketState['connectionStatus']) => void;
	setError: (error: string | null) => void;
	joinRoom: (roomId: string) => void;
	leaveRoom: () => void;
	getMessagesByType: (type: string) => SocketMessage[];
	getRecentMessages: (limit?: number) => SocketMessage[];
}

// Combined socket slice type
export interface SocketSlice {
	socket: SocketState & SocketActions;
}

// Initial socket state
const initialSocketState: SocketState = {
	isConnected: false,
	connectionStatus: 'disconnected',
	messages: [],
	lastMessage: null,
	error: null,
	reconnectAttempts: 0,
	maxReconnectAttempts: 5,
	socketUrl: '',
};

// Mock WebSocket implementation
let mockSocket: WebSocket | null = null;

// Create the socket slice
const createSocketSlice: StateCreator<
	AppStoreState,
	[],
	[['zustand/persist', unknown]],
	SocketSlice
	// [keyof StoreMutators<unknown, unknown>, unknown][]
> = (set, get) => ({
	socket: {
		...initialSocketState,

		setConnectionStatus: (status) => {
			set((state) => ({
				socket: {
					...state.socket,
					connectionStatus: status,
					isConnected: status === 'connected',
				},
			}));
		},

		setError: (error) => {
			set((state) => ({
				socket: {
					...state.socket,
					error,
				},
			}));
		},

		connect: (url, roomId) => {
			const { socket } = get();

			if (socket.isConnected) {
				console.log('Socket already connected');
				return;
			}

			set((state) => ({
				socket: {
					...state.socket,
					connectionStatus: 'connecting',
					socketUrl: url,
					roomId,
					error: null,
				},
			}));

			try {
				// In a real implementation, you would use actual WebSocket
				// For demo purposes, we'll simulate socket connection
				setTimeout(() => {
					set((state) => ({
						socket: {
							...state.socket,
							connectionStatus: 'connected',
							isConnected: true,
							reconnectAttempts: 0,
						},
					}));

					// Simulate receiving messages
					const simulateMessage = () => {
						const message: SocketMessage = {
							id: Date.now().toString(),
							type: 'system',
							data: {
								message: 'Connected to server',
								timestamp: new Date().toISOString(),
							},
							timestamp: new Date().toISOString(),
						};
						get().socket.addMessage(message);
					};

					simulateMessage();

					// Simulate periodic messages
					const interval = setInterval(() => {
						if (get().socket.isConnected) {
							const message: SocketMessage = {
								id: Date.now().toString(),
								type: 'heartbeat',
								data: { timestamp: new Date().toISOString() },
								timestamp: new Date().toISOString(),
							};
							get().socket.addMessage(message);
						} else {
							clearInterval(interval);
						}
					}, 30000); // Every 30 seconds
				}, 1000);
			} catch (error) {
				set((state) => ({
					socket: {
						...state.socket,
						connectionStatus: 'error',
						error: error instanceof Error ? error.message : 'Connection failed',
						reconnectAttempts: state.socket.reconnectAttempts + 1,
					},
				}));
			}
		},

		disconnect: () => {
			if (mockSocket) {
				mockSocket.close();
				mockSocket = null;
			}

			set((state) => ({
				socket: {
					...state.socket,
					isConnected: false,
					connectionStatus: 'disconnected',
					error: null,
				},
			}));
		},

		sendMessage: (type, data) => {
			const { socket } = get();

			if (!socket.isConnected) {
				console.error('Socket not connected');
				return;
			}

			const message: SocketMessage = {
				id: Date.now().toString(),
				type,
				data,
				timestamp: new Date().toISOString(),
			};

			// In real implementation, send via WebSocket
			console.log('Sending message:', message);

			// Add to local messages for demo
			get().socket.addMessage({
				...message,
				type: `sent_${type}`,
			});
		},

		addMessage: (message) => {
			set((state) => ({
				socket: {
					...state.socket,
					messages: [...state.socket.messages, message],
					lastMessage: message,
				},
			}));
		},

		clearMessages: () => {
			set((state) => ({
				socket: {
					...state.socket,
					messages: [],
					lastMessage: null,
				},
			}));
		},

		joinRoom: (roomId) => {
			const { socket } = get();

			set((state) => ({
				socket: {
					...state.socket,
					roomId,
				},
			}));

			if (socket.isConnected) {
				get().socket.sendMessage('join_room', { roomId });
			}
		},

		leaveRoom: () => {
			const { socket } = get();

			if (socket.isConnected && socket.roomId) {
				get().socket.sendMessage('leave_room', { roomId: socket.roomId });
			}

			set((state) => ({
				socket: {
					...state.socket,
					roomId: undefined,
				},
			}));
		},

		getMessagesByType: (type) => {
			const { socket } = get();
			return socket.messages.filter((message) => message.type === type);
		},

		getRecentMessages: (limit = 10) => {
			const { socket } = get();
			return socket.messages.slice(-limit);
		},
	},
});

export default createSocketSlice;
