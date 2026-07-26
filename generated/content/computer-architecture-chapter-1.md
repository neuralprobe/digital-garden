---
id: "ca-ch1-series"
title: "Computer Architecture Chapter 1"
created: "2026-07-24"
updated: "2026-07-25"
summary: "A four-part guide to the ideas and quantitative methods that shape computer architecture."
status: "active"
type: "index"
topic: "Computer Architecture"
visibility: "public"
published: "2026-07-24T11:00:00-07:00"
slug: "computer-architecture-chapter-1"
cover: "/assets/a/img/covers/computer-architecture-chapter-1.png"
lang: "en"
tags: ["computer-architecture", "hennessy-patterson", "fundamentals", "index"]
series: "Computer Architecture Chapter 1"
featured: true
parent: []
depends_on: []
superseded_by: []
part_of: []
includes: ["[[Why Computer Architecture Changed]]", "[[Classes of Computers and Their Parallelism]]", "[[ISA Microarchitecture and Hardware]]", "[[Quantitative Computer Design]]"]
---
# Computer Architecture Chapter 1

Computer architecture is not merely a catalog of processors or instruction sets. It is the practice of choosing interfaces and implementations while balancing performance, energy, cost, reliability, and the needs of real software.

This four-part guide reorganizes the first chapter of *Computer Architecture: A Quantitative Approach* into a path that can be read in order or explored as a small knowledge graph:

1. [Why Computer Architecture Changed](/posts/what-is-computer-architecture-notes-from-chapter-1-of-hennessy-patterson/) explains how scaling limits moved the field from effortless frequency gains toward parallelism and specialization.
2. [Classes of Computers and Their Parallelism](/posts/classes-of-computers-and-parallelism/) connects device classes to instruction-, data-, thread-, and request-level parallelism.
3. [ISA Microarchitecture and Hardware](/posts/isa-microarchitecture-and-hardware/) separates the software-visible contract from the machinery that implements it.
4. [Quantitative Computer Design](/posts/quantitative-computer-design/) introduces the measurements and principles used to compare design choices.

The sequence moves from historical pressure to design choices and finally to measurement:

```text
Scaling limits
      |
      v
Forms of parallelism
      |
      v
ISA -> Microarchitecture -> Hardware
      |
      v
Quantitative evaluation
```

The articles are original explanations based on personal study notes. The principal reference is John L. Hennessy and David A. Patterson, *Computer Architecture: A Quantitative Approach*, 6th edition.
