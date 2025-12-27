from typing import List, Set
from fastapi import WebSocket
import json
import asyncio


class ConnectionManager:
    """
    Manages WebSocket connections for real-time messaging.
    Supports multiple agents connecting simultaneously.
    """
    
    def __init__(self):
        # All active agent connections
        self.active_connections: List[WebSocket] = []
        # Map agent_id to their WebSocket
        self.agent_connections: dict[int, WebSocket] = {}
        # Track which conversations each agent is viewing
        self.agent_viewing: dict[int, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, agent_id: int = None):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        if agent_id:
            self.agent_connections[agent_id] = websocket
            self.agent_viewing[agent_id] = set()
    
    def disconnect(self, websocket: WebSocket, agent_id: int = None):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if agent_id and agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
            del self.agent_viewing[agent_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected agents"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)
    
    async def broadcast_new_message(self, message_data: dict):
        """Broadcast a new message to all agents"""
        await self.broadcast({
            "type": "new_message",
            "data": message_data
        })
    
    async def broadcast_conversation_update(self, conversation_data: dict):
        """Broadcast conversation update to all agents"""
        await self.broadcast({
            "type": "conversation_update",
            "data": conversation_data
        })
    
    async def broadcast_new_conversation(self, conversation_data: dict):
        """Broadcast new conversation to all agents"""
        await self.broadcast({
            "type": "new_conversation",
            "data": conversation_data
        })
    
    async def notify_agent_typing(self, conversation_id: int, agent_id: int, is_typing: bool):
        """Notify other agents that an agent is typing"""
        await self.broadcast({
            "type": "agent_typing",
            "data": {
                "conversation_id": conversation_id,
                "agent_id": agent_id,
                "is_typing": is_typing
            }
        })
    
    def set_agent_viewing(self, agent_id: int, conversation_id: int):
        """Track which conversation an agent is viewing"""
        if agent_id in self.agent_viewing:
            self.agent_viewing[agent_id].add(conversation_id)
    
    def remove_agent_viewing(self, agent_id: int, conversation_id: int):
        """Remove conversation from agent's viewing list"""
        if agent_id in self.agent_viewing:
            self.agent_viewing[agent_id].discard(conversation_id)
    
    def get_agents_viewing_conversation(self, conversation_id: int) -> List[int]:
        """Get list of agents viewing a specific conversation"""
        return [
            agent_id for agent_id, conversations in self.agent_viewing.items()
            if conversation_id in conversations
        ]


# Global connection manager instance
manager = ConnectionManager()
