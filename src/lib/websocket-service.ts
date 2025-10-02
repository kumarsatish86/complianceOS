import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface DashboardUpdate {
  type: 'metric_update' | 'widget_update' | 'alert' | 'status_change';
  organizationId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface WebSocketUser {
  id: string;
  organizationId: string;
  role: string;
  socketId: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private users: Map<string, WebSocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user authentication and room joining
      socket.on('join_organization', (data: { userId: string; organizationId: string; role: string }) => {
        const { userId, organizationId, role } = data;
        
        // Store user information
        this.users.set(socket.id, {
          id: userId,
          organizationId,
          role,
          socketId: socket.id
        });

        // Join organization room
        socket.join(`org_${organizationId}`);
        console.log(`User ${userId} joined organization ${organizationId}`);

        // Send confirmation
        socket.emit('joined_organization', {
          organizationId,
          message: 'Successfully joined organization room'
        });
      });

      // Handle dashboard subscription
      socket.on('subscribe_dashboard', (data: { organizationId: string; widgetTypes?: string[] }) => {
        const { organizationId, widgetTypes } = data;
        
        // Join specific widget rooms if specified
        if (widgetTypes) {
          widgetTypes.forEach(widgetType => {
            socket.join(`widget_${organizationId}_${widgetType}`);
          });
        }

        socket.emit('subscribed_dashboard', {
          organizationId,
          widgetTypes,
          message: 'Successfully subscribed to dashboard updates'
        });
      });

      // Handle metric updates
      socket.on('request_metric_update', (data: { organizationId: string; metricType: string }) => {
        // This would trigger a metric calculation and broadcast
        this.broadcastMetricUpdate(data.organizationId, data.metricType);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const user = this.users.get(socket.id);
        if (user) {
          console.log(`User ${user.id} disconnected from organization ${user.organizationId}`);
          this.users.delete(socket.id);
        }
      });
    });
  }

  // Broadcast metric updates to organization
  public broadcastMetricUpdate(organizationId: string, metricType: string, data?: Record<string, unknown>) {
    const update: DashboardUpdate = {
      type: 'metric_update',
      organizationId,
      data: data || { metricType, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('dashboard_update', update);
    this.io.to(`widget_${organizationId}_${metricType}`).emit('metric_update', update);
  }

  // Broadcast widget updates
  public broadcastWidgetUpdate(organizationId: string, widgetType: string, data: Record<string, unknown>) {
    const update: DashboardUpdate = {
      type: 'widget_update',
      organizationId,
      data: { widgetType, ...data },
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('dashboard_update', update);
    this.io.to(`widget_${organizationId}_${widgetType}`).emit('widget_update', update);
  }

  // Broadcast alerts
  public broadcastAlert(organizationId: string, alert: Record<string, unknown>) {
    const update: DashboardUpdate = {
      type: 'alert',
      organizationId,
      data: alert,
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('dashboard_update', update);
    this.io.to(`org_${organizationId}`).emit('alert', update);
  }

  // Broadcast status changes
  public broadcastStatusChange(organizationId: string, statusChange: Record<string, unknown>) {
    const update: DashboardUpdate = {
      type: 'status_change',
      organizationId,
      data: statusChange,
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('dashboard_update', update);
    this.io.to(`org_${organizationId}`).emit('status_change', update);
  }

  // Get connected users for organization
  public getOrganizationUsers(organizationId: string): WebSocketUser[] {
    return Array.from(this.users.values()).filter(
      user => user.organizationId === organizationId
    );
  }

  // Get total connected users
  public getTotalUsers(): number {
    return this.users.size;
  }

  // Send message to specific user
  public sendToUser(userId: string, event: string, data: Record<string, unknown>) {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    if (user) {
      this.io.to(user.socketId).emit(event, data);
    }
  }

  // Send message to organization
  public sendToOrganization(organizationId: string, event: string, data: Record<string, unknown>) {
    this.io.to(`org_${organizationId}`).emit(event, data);
  }

  // Broadcast to all users
  public broadcast(event: string, data: Record<string, unknown>) {
    this.io.emit(event, data);
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketService {
  if (!wsService) {
    wsService = new WebSocketService(server);
  }
  return wsService;
}

export function getWebSocketService(): WebSocketService | null {
  return wsService;
}
