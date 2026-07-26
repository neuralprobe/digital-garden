---
id: "ca-ch1-quantitative-design"
title: "Quantitative Computer Design"
created: "2026-07-24"
updated: "2026-07-25"
summary: "How performance, reliability, locality, and Amdahl's Law guide architecture decisions."
status: "active"
type: "post"
topic: "Computer Architecture"
visibility: "public"
published: "2026-07-24T15:00:00-07:00"
slug: "quantitative-computer-design"
cover: "/assets/a/img/covers/quantitative-computer-design.webp"
lang: "en"
tags: ["computer-architecture", "performance", "amdahls-law", "benchmarking"]
series: "Computer Architecture Chapter 1"
series_order: "4"
featured: false
parent: ["[[Computer Architecture Chapter 1]]"]
depends_on: ["[[Why Computer Architecture Changed]]", "[[ISA Microarchitecture and Hardware]]"]
superseded_by: []
part_of: []
includes: []
---
# Quantitative Computer Design

Architecture is full of appealing ideas. Larger caches should reduce misses. More cores should increase throughput. A specialized engine should save energy. None of those statements is a decision until it is connected to a workload, a baseline, and a measurement.

Quantitative design turns architectural intuition into comparisons that can be tested.

## Begin with the service being delivered

Performance has several meanings:

- latency is the time required to complete one task;
- throughput is the number of tasks completed in an interval;
- response time includes the delays visible to a user or service;
- tail latency describes unusually slow requests that may determine service quality.

Improving one metric may harm another. Batching can increase throughput while making an individual request wait longer. A mobile processor may deliver impressive peak performance but quickly reduce frequency to remain within its thermal limit.

The right metric follows from the class of computer and its goal. [Classes of Computers and Their Parallelism](/posts/classes-of-computers-and-parallelism/) provides that context.

## CPI and IPC

For a processor, two common summaries are cycles per instruction and instructions per cycle.

Execution time can be decomposed conceptually as:

$$
\text{Execution time}
= \text{Instruction count}
\times \text{CPI}
\times \text{Clock cycle time}.
$$

The decomposition is a product, not a pipeline:

```text
Instructions / program
          x
Cycles / instruction
          x
Seconds / cycle
          =
Seconds / program
```

IPC is the reciprocal of CPI only when they are measured over the same interval and under compatible assumptions. Neither number is meaningful in isolation. A processor can execute more instructions because its ISA or compiler expresses the same work differently. A high clock frequency can be offset by more cycles per instruction.

For this reason, elapsed time on a representative workload remains the most direct performance measure.

## Benchmarks are models of use

A benchmark is not reality; it is a deliberately selected model of reality.

Common forms include:

- kernels that isolate an important computational pattern;
- small programs chosen for convenience;
- synthetic programs constructed to stress a behavior;
- benchmark suites that cover a range of applications.

Benchmarks become misleading when they are easy to optimize but poorly matched to actual use. A suite is more credible when its workloads, inputs, compilation, system configuration, and reporting rules are explicit.

The same discipline applies to accelerator evaluation. A speedup measured against a weak baseline, without data-transfer cost, or on a narrow kernel may not predict application-level benefit.

## Focus on the common case

Resources should usually be spent where a system spends its time. This principle sounds obvious, but it requires measurement. An optimization to a rare event can be dramatic and still have little effect on total execution time.

A common case can also change. A cache sized for yesterday's working set may be ineffective for a new workload. A specialized instruction may be valuable only while software uses the operation frequently enough to justify its area and verification cost.

## Locality

Programs tend to reuse recently accessed data and instructions, and they often access nearby locations. Temporal and spatial locality make memory hierarchies effective.

Caches work because a small, fast storage structure can hold the active portion of a much larger memory. Prefetchers and translation structures also exploit patterns in access behavior. When a workload lacks the assumed locality, these mechanisms can consume energy and bandwidth without providing the expected benefit.

## Amdahl's Law

If a fraction $F$ of execution time is improved by a factor $S$, the total speedup is:

$$
\text{Speedup}_{total}
= \frac{1}{(1-F) + F/S}.
$$

The formula expresses a hard limit: the unaffected portion remains. Even an infinitely fast optimization of one component cannot remove time spent elsewhere.

For parallel processors, the serial fraction limits the value of adding cores. For accelerators, host computation and data movement can dominate after the accelerated kernel becomes fast. For storage, optimizing device latency may expose software overheads that were previously hidden.

Amdahl's Law is therefore not pessimism. It is a prompt to measure the whole system and look for the next bottleneck.

## Dependability is quantitative too

A system must deliver correct service, not merely complete work quickly.

Two useful quantities are:

- mean time to failure, describing how long a module operates before failing;
- mean time to repair or restore, describing how long service takes to recover.

Availability can be summarized as:

$$
\text{Availability}
= \frac{\text{MTTF}}{\text{MTTF} + \text{MTTR}}.
$$

At warehouse scale, component failures are routine rather than exceptional. Replication, error detection, failover, and repair procedures become architectural mechanisms. At smaller scales, reliability may instead be dominated by cost, environment, or safety requirements.

## Compare complete alternatives

A sound architecture comparison states:

1. the workload and input;
2. the baseline;
3. the measured objective;
4. the constraints;
5. the parts of the system included in the measurement.

This discipline connects the software-visible choices in [ISA Microarchitecture and Hardware](/posts/isa-microarchitecture-and-hardware/) to real implementations. It also explains why the shift described in [Why Computer Architecture Changed](/posts/what-is-computer-architecture-notes-from-chapter-1-of-hennessy-patterson/) produced heterogeneous systems rather than one universally superior processor.

## Reference

John L. Hennessy and David A. Patterson, *Computer Architecture: A Quantitative Approach*, 6th edition, Chapter 1.
