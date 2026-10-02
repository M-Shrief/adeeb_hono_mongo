export interface Order {
    name: string;
    reviewed: boolean;
    id: string;
    phone: string;
    address: string;
    delivery_schedule: Date | null;
    is_updateable: boolean;
    status: "in progress" | "aborted" | "completed";
    user_id: string | null;
    prints: {
        id: string;
        is_couplet: boolean | null;
        verses: string[] | null;
        poem_id: string | null;
        qoute: string | null;
        font_type: string;
        font_color: string;
        outfit_type: "تيشيرت - لياقة 7" | "تيشيرت - نص لياقة " | "تشيرت - لياقة بولو" | "جاكيت" | "سويت شيرت" | "بلوفر";
        outfit_color: string;
        prose_qoute_id: string | null;
        chosen_verse_id: string | null;
    }[];
};