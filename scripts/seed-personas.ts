import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PERSONAS = [
    {
        id: 'suzuki_01',
        name: 'Suzuki (New Hire)',
        role: 'new_hire',
        department: 'General Affairs',
        stamina: 9999,
        points: 120,
        mentor_mode: true
    },
    {
        id: 'sato_02',
        name: 'Sato (Veteran)',
        role: 'veteran',
        department: 'City Planning',
        stamina: 60,
        points: 850,
        mentor_mode: false
    },
    {
        id: 'tanaka_03',
        name: 'Tanaka (Manager)',
        role: 'manager',
        department: 'Administration',
        stamina: 40,
        points: 3200,
        mentor_mode: false
    }
];

async function seedPersonas() {
    console.log('Seeding personas into users table...');
    for (const persona of PERSONAS) {
        const { error } = await supabase
            .from('users')
            .upsert(persona, { onConflict: 'id' });

        if (error) {
            console.error(`Failed to seed ${persona.id}:`, error.message);
        } else {
            console.log(`Successfully seeded/updated ${persona.id}`);
        }
    }
}

seedPersonas();
