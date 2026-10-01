export interface Adeeb {
    id: string;
    name: string;
    bio: string;
    time_period: "غير محدد" | "جاهلي" | "أموي" | "عباسي" | "أندلسي" | "عثماني ومملوكي" | "حديث" | null;
    reviewed: boolean;
    poems: {
        id: string;
        intro: string;
    }[];
    chosen_verses: {
        id: string;
        is_couplet: boolean;
        verses: string[];
    }[];
    prose_qoutes: {
        id: string;
        qoute: string;
    }[];
} 