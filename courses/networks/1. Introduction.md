# 1. Introduction to Networks and Cybersecurity
## 1.1 What Is a Computer Network?

A computer network is a set of interconnected nodes, typically computers, servers, or other devices, capable of exchanging data with one another. These computer networks let devices share information with one another. The physical part of the network is the equipment like cables and routers. The logical part of the network is how the information gets from one device to another.

The primary function of a network is to enable resource and data sharing among connected machines. This means devices on the network can look at the files and use the same printers. They can also use the services like messaging systems. Computer networks also let devices connect to the Internet and to things that're not on the local network.

Networked systems also rely on redundancy: by providing multiple paths between nodes, a network can maintain communication even when individual components fail. This capacity is called fault tolerance.

**Network classification**

Computer networks are classified according to three main criteria: geographic scope, topology, and switching mode.
- **Geographic scope** refers to the physical extent of a network. 
  - **PAN** : a Personal Area Network covers the immediate vicinity of a single user, typically within a few metres, and connects personal devices such as smartphones or smartwatchs. 
  - **LAN** : a Local Area Network covers a limited area such as a building. 
  - **MAN** : a Metropolitan Area Network spans a city or a large urban zone, often interconnecting several LANs. 
  - **RAN** : a Radio Access Network designates the portion of a mobile telecommunications network that connects end-user devices to the core network via radio links. 
  - **WAN** : a Wide Area Network covers large geographic distances, potentially spanning countries or continents. For example, the Internet.

![Geographic Scope](./courses/networks/1GeographicScope.svg)









- **Topology** describes the arrangement of nodes and links within a network. 
    - In a bus topology, all nodes share a single communication medium; any signal transmitted by one node is received by all others. 
    - In a star topology, each node connects to a central device, such as a switch or hub, which manages traffic between nodes. 
    - In a ring topology, nodes are connected in a closed loop, with data travelling in one or both directions around the ring. 
    - In a mesh topology, nodes are interconnected directly with one another, either partially or fully, providing multiple paths between any two points.
- **Switching mode** refers to the method by which data is transferred across a network. Circuit switching establishes a dedicated communication path between two endpoints for the duration of a session, as in traditional telephone networks. Packet switching divides data into discrete units called packets, each of which is routed independently across the network and reassembled at the destination; this is the mode used by the Internet. Cell switching, used in Asynchronous Transfer Mode networks, is a variant of packet switching in which all units, called cells, have a fixed length, which simplifies processing and supports predictable transmission delays.

**Paragraph 2: Performance Characteristics**
- Bandwidth and throughput
- Latency and jitter
- Error rate and reliability
- Scalability

## 1.2 Cybersecurity: Definition and Stakes
### 1.2.1 Definition of Cybersecurity

**Paragraph 1: Scope of the Discipline**
- Protection of information systems, networks and data
- Distinction between offensive and defensive security
- Relationship between network security, application security
  and physical security

### 1.2.2 The CIA Triad

**Paragraph 1: Confidentiality**
- Definition: data access restricted to authorised entities
- Associated mechanisms: encryption, access control, classification

**Paragraph 2: Integrity**
- Definition: guarantee that data has not been altered
- Associated mechanisms: hashing, digital signatures, logging

**Paragraph 3: Availability**
- Definition: accessibility of systems and data when needed
- Associated mechanisms: redundancy, backups, continuity plans

### 1.2.3 Current Threat Landscape

**Paragraph 1: Overview of Contemporary Threats**
- Increasing volume and sophistication of attacks
- Actors: cybercriminals, nation-states, hacktivists, malicious insiders
- Dominant vectors: phishing, ransomware, supply chain attacks

**Paragraph 2: Factors Driving Change**
- Accelerated digitalisation of organisations
- Expanding attack surface (IoT, cloud, remote work)
- Professionalisation of malicious groups

## 1.3 Regulatory and Legal Frameworks
### 1.3.1 Applicable Regulations

**Paragraph 1: GDPR**
- Scope and fundamental principles
- Obligations of data controllers
- Rights of data subjects
- Sanctions and supervisory authorities

**Paragraph 2: NIS2**
- Expanded scope compared to NIS1
- Essential entities and important entities
- Incident reporting obligations

**Paragraph 3: French Military Programming Law**
- Operators of vital importance
- Security obligations imposed by ANSSI
- Controls and audits

**Paragraph 4: PCI-DSS**
- Context: payment card data security
- The 12 main requirements
- Compliance levels and QSA audits

### 1.3.2 Technical Reference Standards

**Paragraph 1: ISO 27001**
- Information security management system
- Certification process
- Risk-based approach

**Paragraph 2: ISO 27002**
- Catalogue of security measures
- Relationship with ISO 27001
- Domains covered: access control, cryptography, physical security

### 1.3.3 Key Roles in Information Security

**Paragraph 1: The CISO**
- Responsibilities: defining the security policy
- Position within the organisation
- Relationship with senior management and business units

**Paragraph 2: The DPO**
- Role under the GDPR
- Independence and advisory duties
- Relationship with the CISO

## 1.4 Threat Models and Analysis Frameworks
