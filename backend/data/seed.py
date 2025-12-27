"""
Seed script to populate the database with sample data.
Run this script after starting the backend to load sample messages.
"""

import asyncio
import csv
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import Base, DATABASE_URL
from app.models import Customer, Agent, Conversation, Message, CannedMessage, MessagePriority, MessageStatus
from app.services import detect_priority


async def seed_database():
    """Seed the database with sample data"""
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_maker() as session:
        # Check if data already exists
        from sqlalchemy import select, func
        result = await session.execute(select(func.count(Agent.id)))
        if result.scalar() > 0:
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding database...")
        
        # Create sample agents
        agents = [
            Agent(
                name="Alex Thompson",
                email="alex.t@branch.com",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
                is_online=True
            ),
            Agent(
                name="Maria Garcia",
                email="maria.g@branch.com",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
                is_online=True
            ),
            Agent(
                name="James Chen",
                email="james.c@branch.com",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=James",
                is_online=False
            ),
            Agent(
                name="Sophie Wilson",
                email="sophie.w@branch.com",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
                is_online=True
            ),
        ]
        
        for agent in agents:
            session.add(agent)
        
        await session.commit()
        print(f"Created {len(agents)} agents")
        
        # Create canned messages
        canned_messages = [
            CannedMessage(
                title="Greeting",
                content="Hello! Thank you for contacting Branch support. How can I help you today?",
                category="General",
                shortcut="/hello"
            ),
            CannedMessage(
                title="Loan Status Check",
                content="I'd be happy to check the status of your loan application. Please give me a moment to look into this for you.",
                category="Loan",
                shortcut="/loanstatus"
            ),
            CannedMessage(
                title="Loan Approval Timeline",
                content="Loan applications are typically processed within 24-48 hours. If it's been longer than that, I can escalate this for you.",
                category="Loan",
                shortcut="/timeline"
            ),
            CannedMessage(
                title="Disbursement Info",
                content="Once your loan is approved, disbursement typically takes 1-2 business days. The funds will be sent directly to your registered bank account.",
                category="Loan",
                shortcut="/disburse"
            ),
            CannedMessage(
                title="Account Recovery",
                content="I understand you're having trouble accessing your account. Let me help you reset your password. Please verify your registered email address.",
                category="Account",
                shortcut="/recovery"
            ),
            CannedMessage(
                title="KYC Documents",
                content="For KYC verification, we require: 1) A valid government ID (passport, driver's license, or national ID), 2) Proof of address (utility bill or bank statement), 3) A recent selfie holding your ID.",
                category="Account",
                shortcut="/kyc"
            ),
            CannedMessage(
                title="Payment Issue",
                content="I'm sorry to hear about the payment issue. Let me investigate this for you. Can you please provide the transaction reference number or date of the transaction?",
                category="Payment",
                shortcut="/payment"
            ),
            CannedMessage(
                title="Refund Process",
                content="I've initiated the refund process for you. Please allow 5-7 business days for the amount to reflect in your account. You'll receive an email confirmation shortly.",
                category="Payment",
                shortcut="/refund"
            ),
            CannedMessage(
                title="Escalation",
                content="I understand this is urgent. I'm escalating your case to our senior support team who will contact you within the next 2 hours.",
                category="General",
                shortcut="/escalate"
            ),
            CannedMessage(
                title="Closing",
                content="Is there anything else I can help you with today? If not, thank you for contacting Branch support. Have a great day!",
                category="General",
                shortcut="/close"
            ),
            CannedMessage(
                title="Security Alert Response",
                content="Thank you for reporting this. We take security very seriously. I've flagged your account for a security review. Please do not share your PIN, password, or OTP with anyone. Branch will never ask for these details.",
                category="Security",
                shortcut="/security"
            ),
            CannedMessage(
                title="Interest Rate Info",
                content="Our interest rates range from 5% to 15% depending on your credit history, loan amount, and tenure. I can help you calculate the exact rate for your specific case.",
                category="Loan",
                shortcut="/interest"
            ),
        ]
        
        for canned in canned_messages:
            session.add(canned)
        
        await session.commit()
        print(f"Created {len(canned_messages)} canned messages")
        
        # Load messages from GeneralistRails CSV (real customer messages)
        generalist_csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'GeneralistRails_Project_MessageData.csv')
        
        if os.path.exists(generalist_csv_path):
            print(f"Loading messages from GeneralistRails_Project_MessageData.csv...")
            
            # First, read all messages and group by User ID
            messages_by_user = {}
            with open(generalist_csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    user_id = row['User ID'].strip()
                    if user_id not in messages_by_user:
                        messages_by_user[user_id] = []
                    messages_by_user[user_id].append({
                        'timestamp': row['Timestamp (UTC)'].strip(),
                        'message': row['Message Body'].strip()
                    })
            
            # Sort each user's messages by timestamp (oldest first)
            for user_id in messages_by_user:
                messages_by_user[user_id].sort(key=lambda x: x['timestamp'])
            
            customer_map = {}  # Track created customers
            
            for user_id, user_messages in messages_by_user.items():
                # Create customer for this user ID
                email = f"customer{user_id}@example.com"
                
                # Assign random loan status to some customers
                loan_statuses = [None, "pending", "approved", "disbursed", "repaying"]
                loan_status = loan_statuses[hash(user_id) % len(loan_statuses)]
                loan_amount = (hash(user_id) % 50 + 10) * 100 if loan_status else None
                
                customer = Customer(
                    name=f"Customer {user_id}",
                    email=email,
                    phone=f"+254700{user_id.zfill(6)[-6:]}" if len(user_id) <= 6 else None,
                    account_status="active",
                    loan_status=loan_status,
                    loan_amount=loan_amount,
                    profile_notes=f"Customer ID: {user_id}. Contact via app messaging."
                )
                session.add(customer)
                await session.commit()
                await session.refresh(customer)
                customer_map[user_id] = customer
                
                # Detect priority based on first message (typically sets the tone)
                first_message = user_messages[0]['message']
                priority, confidence = detect_priority(first_message)
                
                # Create a single conversation for all messages from this user
                subject = first_message[:100] if len(first_message) > 100 else first_message
                conversation = Conversation(
                    customer_id=customer.id,
                    status=MessageStatus.OPEN,
                    priority=priority,
                    subject=subject,
                    created_at=datetime.strptime(user_messages[0]['timestamp'], '%Y-%m-%d %H:%M:%S')
                )
                session.add(conversation)
                await session.commit()
                await session.refresh(conversation)
                
                # Add all messages to this conversation
                for msg_data in user_messages:
                    msg_priority, _ = detect_priority(msg_data['message'])
                    message = Message(
                        conversation_id=conversation.id,
                        customer_id=customer.id,
                        content=msg_data['message'],
                        is_from_customer=True,
                        priority=msg_priority,
                        created_at=datetime.strptime(msg_data['timestamp'], '%Y-%m-%d %H:%M:%S')
                    )
                    session.add(message)
                
                await session.commit()
            
            print(f"Loaded {len(messages_by_user)} customer conversations from GeneralistRails CSV")
        else:
            print(f"GeneralistRails CSV not found at {generalist_csv_path}")
        
        print("Database seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_database())
