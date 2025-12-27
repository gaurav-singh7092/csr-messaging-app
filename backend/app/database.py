from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select, func
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./branch_messaging.db")

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Auto-seed if database is empty
    await seed_initial_data()


async def seed_initial_data():
    """Seed initial data if database is empty"""
    from .models import Agent, Customer, Conversation, Message, CannedMessage, MessagePriority, MessageStatus
    
    async with async_session_maker() as session:
        # Check if agents exist
        result = await session.execute(select(func.count(Agent.id)))
        if result.scalar() > 0:
            print("Database already has data. Skipping seed.")
            return
        
        print("Seeding database with initial data...")
        
        # Create sample agents
        agents = [
            Agent(name="Alex Thompson", email="alex.t@branch.com", is_online=True),
            Agent(name="Maria Garcia", email="maria.g@branch.com", is_online=True),
            Agent(name="James Chen", email="james.c@branch.com", is_online=False),
            Agent(name="Sophie Wilson", email="sophie.w@branch.com", is_online=True),
        ]
        for agent in agents:
            session.add(agent)
        await session.flush()
        
        # Create sample customers
        customers = [
            Customer(name="John Smith", email="john.smith@email.com", phone="+1234567890", account_status="active", loan_status="approved", loan_amount=5000),
            Customer(name="Sarah Johnson", email="sarah.j@email.com", phone="+0987654321", account_status="active", loan_status="pending", loan_amount=3000),
            Customer(name="Mike Williams", email="mike.w@email.com", phone="+1122334455", account_status="active", loan_status="none"),
        ]
        for customer in customers:
            session.add(customer)
        await session.flush()
        
        # Create sample conversations
        conv1 = Conversation(customer_id=customers[0].id, agent_id=agents[0].id, status=MessageStatus.ACTIVE, priority=MessagePriority.HIGH, subject="Loan disbursement inquiry")
        conv2 = Conversation(customer_id=customers[1].id, agent_id=agents[1].id, status=MessageStatus.WAITING, priority=MessagePriority.MEDIUM, subject="Account verification")
        conv3 = Conversation(customer_id=customers[2].id, status=MessageStatus.ACTIVE, priority=MessagePriority.LOW, subject="General inquiry")
        session.add_all([conv1, conv2, conv3])
        await session.flush()
        
        # Create sample messages
        messages = [
            Message(conversation_id=conv1.id, customer_id=customers[0].id, content="Hi, when will my loan be disbursed?", is_from_customer=True, priority=MessagePriority.HIGH),
            Message(conversation_id=conv1.id, agent_id=agents[0].id, content="Hello! Let me check your loan status.", is_from_customer=False, priority=MessagePriority.HIGH),
            Message(conversation_id=conv2.id, customer_id=customers[1].id, content="I need to verify my account details", is_from_customer=True, priority=MessagePriority.MEDIUM),
            Message(conversation_id=conv3.id, customer_id=customers[2].id, content="Hello, I have a question about your services", is_from_customer=True, priority=MessagePriority.LOW),
        ]
        for msg in messages:
            session.add(msg)
        
        # Create canned messages
        canned = [
            CannedMessage(title="Greeting", content="Hello! Thank you for contacting Branch support. How can I help you today?", category="General", shortcut="/hello"),
            CannedMessage(title="Loan Status", content="I'd be happy to check the status of your loan application. Please give me a moment.", category="Loan", shortcut="/loanstatus"),
            CannedMessage(title="Closing", content="Is there anything else I can help you with today?", category="General", shortcut="/closing"),
        ]
        for c in canned:
            session.add(c)
        
        await session.commit()
        print("Database seeded successfully!")
