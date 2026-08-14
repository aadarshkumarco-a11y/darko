export interface TimelineEvent {
  year: string;
  date?: string;
  title: string;
  description: string;
  detail: string;
  accentColor: "saffron" | "white" | "green" | "gold" | "blue";
  icon: string;
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    year: "1857",
    date: "10 May 1857",
    title: "First War of Independence",
    description: "The Sepoy Mutiny — India's first major armed uprising against the British East India Company.",
    detail: "Started by Mangal Pandey's mutiny at Barrackpore, the uprising spread across Meerut, Delhi, Kanpur, Lucknow, and Jhansi. Led by figures like Rani Lakshmibai, Bahadur Shah Zafar, and Nana Saheb, it was ultimately crushed, but it planted the irreversible seed of India's desire for freedom. The British Crown took direct control of India from the East India Company in its aftermath.",
    accentColor: "saffron",
    icon: "⚔",
  },
  {
    year: "1885",
    date: "28 Dec 1885",
    title: "Formation of Indian National Congress",
    description: "Birth of the platform that would lead India to freedom.",
    detail: "Founded in Bombay by A.O. Hume, a retired British civil servant, with 72 delegates. The INC began as a moderate forum for dialogue with the British but evolved under leaders like Dadabhai Naoroji, Pherozeshah Mehta, and later Gandhi, Nehru, and Patel into the principal vehicle of the independence movement. It became the voice of a unified Indian nation.",
    accentColor: "blue",
    icon: "✦",
  },
  {
    year: "1919",
    date: "13 Apr 1919",
    title: "Jallianwala Bagh Massacre",
    description: "The day that turned moderates into revolutionaries.",
    detail: "On Baisakhi, Brigadier-General Reginald Dyer ordered his troops to fire without warning on a peaceful gathering of unarmed men, women, and children at Jallianwala Bagh, Amritsar. Hundreds were killed. The brutality shocked the nation — Tagore returned his knighthood, and Gandhi launched the Non-Cooperation Movement. It is widely regarded as the turning point that ended any hope of reconciliation with British rule.",
    accentColor: "gold",
    icon: "✝",
  },
  {
    year: "1920",
    date: "Sep 1920",
    title: "Non-Cooperation Movement",
    description: "Gandhi's first mass civil disobedience campaign.",
    detail: "Launched by Gandhi in response to Jallianwala Bagh and the Rowlatt Act, the movement urged Indians to boycott British schools, courts, goods, and titles. Millions participated — students left colleges, lawyers gave up practice, foreign cloth was burnt. The movement was withdrawn in 1922 after the violent Chauri Chaura incident, but it proved that the Indian masses could be mobilized for a national cause.",
    accentColor: "white",
    icon: "✊",
  },
  {
    year: "1930",
    date: "12 Mar – 6 Apr 1930",
    title: "Salt March · Civil Disobedience",
    description: "Gandhi walked 240 miles to make salt from the sea — and shook an empire.",
    detail: "Starting from Sabarmati Ashram on 12 March 1930, Gandhi and 78 companions walked 240 miles over 24 days to Dandi on the Gujarat coast. There, he picked up a handful of salt, breaking the British salt monopoly. The act was simple, the symbolism was cosmic — millions of Indians across the country broke the salt law. Over 60,000 were arrested. The world's press watched as the moral authority of non-violence humbled the world's greatest empire.",
    accentColor: "green",
    icon: "☮",
  },
  {
    year: "1942",
    date: "8 Aug 1942",
    title: "Quit India Movement",
    description: "'Karenge ya Marenge' — Do or Die.",
    detail: "At the Gowalia Tank Maidan in Bombay, Gandhi gave the call: 'We shall either free India or die in the attempt.' The All India Congress Committee passed the Quit India Resolution on 8 August 1942. The British arrested the entire Congress leadership within hours. But the movement erupted spontaneously across the country — students, workers, peasants, and even princely state subjects joined. Though suppressed militarily, it convinced the British that their rule was no longer tenable.",
    accentColor: "saffron",
    icon: "⚑",
  },
  {
    year: "1947",
    date: "15 Aug 1947",
    title: "Independence",
    description: "At the stroke of the midnight hour, India awoke to life and freedom.",
    detail: "On the midnight of 14–15 August 1947, Jawaharlal Nehru delivered his 'Tryst with Destiny' speech in the Constituent Assembly. India's first Prime Minister hoisted the Tiranga at the Red Fort. Freedom came at the cost of Partition — millions were displaced, but a nation of 340 million people became the world's largest democracy. The journey from sacrifice to freedom was complete. The journey from freedom to progress had just begun.",
    accentColor: "green",
    icon: "★",
  },
];
