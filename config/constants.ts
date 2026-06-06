// Re-export types for backward compatibility
export type { VaultNode } from '../types/vault';

// Import type for use in this file
import type { VaultNode } from '../types/vault';

// Fallback data for development only (when vault.json is not available)
// In production, this should never be used - data comes from vault.json
export const FALLBACK_VAULT_DATA: VaultNode[] = [
  {
    id: 'home',
    title: 'root.md',
    type: 'system',
    updated: '2024-03-10T14:20:00Z',
    description: 'System Root & Index',
    exclude_from_graph: true,
    content: `## System Initialization
    
**Identity Confirmed:** Halit Alptekin
**Role:** Cyber Warfare Research / Security Engineering

You have accessed a non-linear knowledge graph designed to map the chaotic landscape of modern cyber threats. This is not a blog; it is a live repository of **Tactics, Techniques, and Procedures (TTPs)** observed in the wild.

I bridge the gap between **Offensive Operations** (Red Teaming, Exploit Dev) and **Defensive Strategy** (Forensics, Threat Hunting).

### Core Modules
* **[[Advanced Malware Techniques]]**: Deobfuscation & Reverse Engineering of binary payloads.
* **[[Project Chimera]]**: Automated hardware hacking framework.
* **[[NetWatch Intel Feed]]**: Threat intelligence gathering.
* **[[System Capabilities]]**: Visual demonstration of this platform's rendering engine.
`,
  },
  {
    id: 'demo-capabilities',
    title: 'System Capabilities',
    type: 'blog',
    created: '2024-03-01',
    updated: '2024-03-02T11:45:00Z',
    description: 'Demonstration of rendering engine features, graphs, and visual reconnaissance.',
    stack: ['Demo', 'Markdown', 'React'],
    signature: '-----BEGIN PGP SIGNATURE-----\nVRF_SIG_DEMO_0x9A4F...',
    cover_image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
    related_ids: ['malware-analysis'],
    content: `This post demonstrates the rendering engine's ability to handle complex technical content including tables, callouts, and media. For more details on specific techniques, see [[Advanced Malware Techniques]] and related research on [[Behavioral Analysis of State-Sponsored Actors]].

### 1. Visual Reconnaissance
Referencing visual data is critical for forensics. See **Figure 1** below for the memory map. This technique is commonly used in [[Advanced Malware Techniques]] for process analysis.

![Memory Injection Flow](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2000&auto=format&fit=crop)

### 2. Threat Intelligence Data
We can render structured datasets directly from markdown. For comprehensive threat intelligence, check out the [[NetWatch Intel Feed]] project.

| Actor | Origin | Primary Target | Threat Level |
| :--- | :--- | :--- | :--- |
| **APT28** | Russia | Government/Military | High |
| **Lazarus** | North Korea | Financial/Crypto | Critical |
| **Volt Typhoon** | China | Critical Infrastructure | Severe |

### 3. Operational Warnings
Crucial information is highlighted using semantic blocks. For defensive strategies, see [[Blue Team Operations in Cloud Environments]].

> [!WARNING]
> **OPSEC ALERT:** Always verify the cryptographic signature of these posts before executing any provided shellcode.

> [!INFO]
> **Note:** All malware samples discussed here have been defanged for safety. For hardware-level analysis, see the [[Chimera Firmware Extractor]] project.

### 4. Code Analysis
The following code demonstrates header analysis techniques used in malware research. For more advanced reverse engineering, refer to [[Advanced Malware Techniques]].

\`\`\`python
def analyze_header(data):
    # Check for MZ header
    if data[0:2] == b'MZ':
        print("[+] PE Header Detected")
        return True
    return False
\`\`\`

### 5. Logic Flow (Mermaid)
We can verify internal logic using graph structures. This attack flow is analyzed in detail in [[Behavioral Analysis of State-Sponsored Actors]].

\`\`\`mermaid
graph TD;
    A[Initial Infection] --> B{Admin Rights?};
    B -- Yes --> C[Install Rootkit];
    B -- No --> D[Privilege Escalation];
    D --> B;
    C --> E[C2 Communication];
    E --> F[Exfiltration];
    style C fill:#ff0055,stroke:#ff0055,stroke-width:2px,color:#fff
    style D fill:#00e5ff,stroke:#00e5ff,stroke-width:2px,color:#000
    style B fill:#000,stroke:#fff,stroke-width:1px,color:#fff
    style A fill:#000,stroke:#fff,stroke-width:1px,color:#fff
    style E fill:#000,stroke:#fff,stroke-width:1px,color:#fff
    style F fill:#000,stroke:#fff,stroke-width:1px,color:#fff
\`\`\`
`,
  },
  {
    id: 'market-analysis-2024',
    title: 'Global Cyber Warfare Market Analysis 2024',
    type: 'blog',
    updated: '2024-03-20T10:00:00Z',
    description: 'Strategic overview of nation-state capabilities and spending.',
    stack: ['Strategy', 'Intel'],
    cover_image:
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2000&auto=format&fit=crop',
    content: `
This analysis bridges the gap between offensive capabilities and defensive expenditures. 

### Strategic Balance
The current market shows a balanced increase in both exploit acquisition and zero-day mitigation strategies.

| Sector | Offensive Spend | Defensive Spend | Trend |
| --- | --- | --- | --- |
| Govt | $4.2B | $4.1B | Balanced |
| Finance | $1.2B | $8.5B | Defensive |
| Critical Infra | $0.8B | $3.2B | Defensive |

When we look at the data, we see that **APT Groups** (Offensive) are driving the innovation that **Blue Teams** (Defensive) must counter. This creates a perfect equilibrium in the high-end market.

> [!INFO]
> This post is balanced to demonstrate the "White" spectrum signal indicating pure analysis without bias.
`,
  },
  {
    id: 'about',
    title: 'whoami',
    type: 'profile',
    updated: '2024-01-15T10:30:00Z',
    description: 'Identity & Operational History',
    exclude_from_graph: true,
    signature: '-----BEGIN PGP SIGNATURE-----\nID_VERIFIED_KEY...',
    avatar:
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000&auto=format&fit=crop', // Cyberpunk/Tech abstract avatar
    skills: [
      { name: 'Malware Analysis', level: 95, type: 'offense' },
      { name: 'Threat Hunting', level: 90, type: 'defense' },
      { name: 'Reverse Engineering', level: 85, type: 'offense' },
      { name: 'Cloud Forensics', level: 80, type: 'defense' },
      { name: 'Exploit Dev', level: 75, type: 'offense' },
      { name: 'Incident Response', level: 90, type: 'defense' },
    ],
    languages: [
      { name: 'Python', level: 95 },
      { name: 'C/C++', level: 85 },
      { name: 'Go', level: 80 },
      { name: 'Assembly', level: 75 },
      { name: 'Rust', level: 60 },
      { name: 'Django', level: 70 },
      { name: 'Docker/K8s', level: 85 },
      { name: 'React', level: 65 },
    ],
    content: `I’m a hacker-minded cybersecurity researcher with a deep and multifaceted background spanning malware analysis, forensics, penetration testing, and threat intelligence. 

Having an MSc in [[Computer Science]], I am driven by a proven track record of success in both academic research and a wide range of operational engagements.

### Operational History
This includes penetration testing of critical infrastructure (including aircraft, TVs, or any kind of hackable IoT device), leading high-profile incident response tasks, conducting complex criminal investigations (regularly contributing to cyber criminal manhunts in collaboration with law enforcement), and producing actionable intelligence on state-sponsored actors and [[APT Groups]].`,
  },
  {
    id: 'malware-analysis',
    title: 'Advanced Malware Techniques',
    type: 'blog',
    created: '2024-01-20',
    updated: '2024-02-10T16:20:00Z',
    stack: ['Reverse Engineering', 'C++', 'Assembly', 'Offensive'],
    description: 'Deep dive into process hollowing and obfuscation.',
    cover_image:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop',
    signature: '-----BEGIN PGP SIGNATURE-----\niQIzBAEBCgAdFiEE...',
    related_ids: ['project-chimera'],
    content: `Modern malware has evolved beyond simple file infection. 

### 1. Process Hollowing
One of the most persistent techniques I encounter is **Process Hollowing**. The malware unmaps the memory of a legitimate process (like \`svchost.exe\`) and replaces it with malicious code.

By using [[IDA Pro]], we can identify the entry point redirection that occurs during this phase.`,
  },
  {
    id: 'project-chimera',
    title: 'Chimera Firmware Extractor',
    type: 'project',
    icon: 'chip',
    created: '2024-02-15',
    updated: '2024-02-20T09:15:00Z',
    stack: ['Python', 'UART', 'JTAG', 'Offensive'],
    description: 'Automated firmware extraction framework.',
    github: 'github.com/halitalptekin/chimera',
    stars: 1240,
    forks: 342,
    cover_image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    content: `Chimera is a Python-based framework designed to automate the extraction of firmware from consumer electronics. It interfaces with standard FTDI adapters to fuzz UART consoles.`,
  },
  {
    id: 'project-netwatch',
    title: 'NetWatch Intel Feed',
    type: 'project',
    icon: 'radar',
    created: '2023-08-10',
    updated: '2023-09-01T11:00:00Z',
    stack: ['Go', 'Redis', 'Entropy', 'Defensive'],
    description: 'Real-time C2 domain tracking.',
    github: 'github.com/halitalptekin/netwatch',
    stars: 856,
    forks: 112,
    content: `A distributed sensor network that monitors newly registered domains for patterns matching known [[APT Groups]]. using entropy analysis.`,
  },
  {
    id: 'paper-iot-fuzzing',
    title: 'Automated Fuzzing of Proprietary IoT Protocols',
    type: 'research',
    publication: 'Journal of Cybersecurity & Privacy',
    year: '2023',
    updated: '2023-11-01T09:00:00Z',
    stack: ['IoT', 'Fuzzing', 'Radio'],
    description: 'Academic paper on IoT protocol security.',
    link: '#',
    bibtex: `@article{alptekin2023iot,
  title={Automated Fuzzing of Proprietary IoT Protocols},
  author={Alptekin, Halit},
  journal={Journal of Cybersecurity & Privacy},
  year={2023},
  volume={12},
  number={4}
}`,
    content:
      'Abstract: This paper presents a novel methodology for fuzzing proprietary wireless protocols used in smart home automation. We introduce a new mutation engine specifically designed for low-power RF stacks.',
  },
  {
    id: 'paper-apt-behavior',
    title: 'Behavioral Analysis of State-Sponsored Actors',
    type: 'research',
    publication: 'IEEE Symposium on Security and Privacy',
    year: '2022',
    updated: '2022-05-15T09:00:00Z',
    stack: ['APT', 'Behavioral Analysis'],
    description: 'Temporal analysis of APT operations.',
    link: '#',
    bibtex: `@inproceedings{alptekin2022apt,
  title={Behavioral Analysis of State-Sponsored Actors},
  author={Alptekin, Halit},
  booktitle={IEEE Symposium on Security and Privacy},
  year={2022},
  pages={112--125}
}`,
    content:
      'Abstract: We analyze the temporal patterns of 4 major APT groups over a 5-year period.',
  },
  {
    id: 'paper-blue-team-ops',
    title: 'Blue Team Operations in Cloud Environments',
    type: 'research',
    publication: 'SANS Institute Reading Room',
    year: '2024',
    updated: '2024-01-10T09:00:00Z',
    stack: ['Cloud', 'Blue Team', 'Defensive'],
    description: 'Strategies for logging and monitoring in AWS.',
    link: '#',
    bibtex: `@article{alptekin2024blue,
  title={Blue Team Operations in Cloud Environments},
  author={Alptekin, Halit},
  year={2024}
}`,
    content:
      'Abstract: This paper outlines a comprehensive defensive strategy for cloud-native infrastructure, focusing on anomaly detection in CloudTrail logs.',
  },
];

// Note: In production, VAULT_DATA should be loaded from vault.json
// This fallback is only for development when vault.json is not available
