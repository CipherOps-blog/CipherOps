# Kyber KEM

## Overview

Kyber is a key encapsulation mechanism (KEM) based on the hardness of the **Module Learning With Errors (MLWE)** problem. It was standardized by NIST in 2024 under the name **ML-KEM (FIPS 203)**.

## Core Idea

Kyber uses structured lattices to build an efficient and compact KEM. Its security reduces to the difficulty of solving MLWE, which is believed to be hard even for quantum computers.

## Variants

| Variant | Security Level | Public Key Size |
|---|---|---|
| Kyber-512 | AES-128 | 800 bytes |
| Kyber-768 | AES-192 | 1184 bytes |
| Kyber-1024 | AES-256 | 1568 bytes |

*More detailed content coming soon.*
