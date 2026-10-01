export interface ProseQoute {
 reviewed: boolean;
 id: string;
 adeeb_id: string;
 tags: string[];
 source: string | null;
 qoute: string;
 adeeb: {
 name: string;
 id: string;
 };
}