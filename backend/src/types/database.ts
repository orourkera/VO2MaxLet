export interface User {
    id: string;
    wallet_address: string;
    created_at: string;
    updated_at: string;
}

export interface Application {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface UserApp {
    user_id: string;
    app_id: string;
    created_at: string;
}

export interface TrainingSession {
    id: string;
    user_id: string;
    app_id: string;
    session_data: {
        duration: number;
        intensity: number;
        heart_rate: number[];
        notes?: string;
        // Add more specific VO2 max training metrics as needed
    };
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: string;
    user_id: string;
    app_id: string;
    amount: number;
    currency: string;
    transaction_hash: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
}

export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<User, 'id'>>;
            };
            applications: {
                Row: Application;
                Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Application, 'id'>>;
            };
            user_apps: {
                Row: UserApp;
                Insert: Omit<UserApp, 'created_at'>;
                Update: never;
            };
            training_sessions: {
                Row: TrainingSession;
                Insert: Omit<TrainingSession, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<TrainingSession, 'id'>>;
            };
            payments: {
                Row: Payment;
                Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Payment, 'id'>>;
            };
        };
    };
} 