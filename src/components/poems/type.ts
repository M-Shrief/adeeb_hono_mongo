export interface Poem {
    id: string;
    intro: string;
    adeeb_id: string;
    is_couplet: boolean;
    verses: string[];
    reviewed: boolean;
    adeeb: {
        name: string;
        id: string;
    };
    chosen_verses: {
        id: string;
        is_couplet: boolean;
        verses: string[];
    }[];
}