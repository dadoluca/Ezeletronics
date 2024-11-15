# Project Estimation - FUTURE
Date: 01/05/2024

Version: 1.0


# Estimation approach
Consider the EZElectronics  project in FUTURE version (as proposed by your team in requirements V2), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch (not from V1)
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |             6                |             
|  A = Estimated average size per class, in LOC       |             420               | 
| S = Estimated size of project, in LOC (= NC * A) | 2520 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |                 252                     |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 7560 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |         1,575 (~2)          |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document | 40 |
| GUI prototype | 25 |
|design document | 15 |
|code | 252 |
| unit tests | 25 |
| api tests | 25 |
| management documents | 12 |



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| Analysis of existing requirements | 4 |
| Stakeholders meeting | 3 |
| Write requirements documentation | 27 |
| Review requirements documentation | 6 |
| Design GUI prototype | 10 |
| Develop GUI prototype | 15 |
| Plan structure of design document | 4 |
| Write design document | 8 |
| Review design document | 3 |
| Develop components and controllers | 70 |
| Develop database interactions | 70 |
| Handle errors | 42 |
| Develop API | 70 |
| Identify areas that require unit testing | 3 |
| Develop test cases | 8 |
| Run unit tests | 1 |
| Debug code | 13 |
| Identify areas that require API testing | 3 |
| Develop API test cases | 8 |
| Run API tests | 1 |
| Debug API code | 13 |
| Cost and effort estimation and scheduling | 12 |

###

![gantt chart](./images/gantt_v2.png)

# Summary

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size | 252 ph | ~2 week |
| estimate by product decomposition | 394 ph | 50 days |
| estimate by activity decomposition | 394 ph | 19 days |

Estimating by size can be really unreliable because LOC depends on several factors (like programming language) and we are considering only the coding part of the project.
Estimating by product decomposition is slightly better because we add non-coding activities too, but we don't use time in an efficient way in this case.
Estimating by activity decomposition allowed us to parallelize tasks using the Gantt chart (assuming 4 people as resources) and save precious time, despite having the same ph amount as the previous approach.




