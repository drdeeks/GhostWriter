# Infrastructure Monitoring Metrics

## Core Metrics

### 1. Server Metrics
| Metric                     | Description                                  | Target Value                  | Alert Threshold               | Collection Method          |
|----------------------------|----------------------------------------------|-------------------------------|-------------------------------|-----------------------------|
| CPU Usage                  | Percentage of CPU utilization                | <70%                          | >90% for >5 minutes          | Datadog                     |
| Memory Usage               | Percentage of memory utilization             | <80%                          | >95% for >5 minutes          | Datadog                     |
| Disk Usage                 | Percentage of disk space used                | <75%                          | >90%                         | Datadog                     |
| Disk I/O                   | Disk read/write operations                  | <500 IOPS                     | >1000 IOPS for >5 minutes    | Datadog                     |
| Network Bandwidth          | Inbound/outbound network traffic             | <500 Mbps                     | >800 Mbps for >5 minutes     | Datadog                     |
| TCP Connections            | Number of active TCP connections             | <5000                         | >8000                        | Datadog                     |

### 2. Service Metrics
| Metric                     | Description                                  | Target Value                  | Alert Threshold               | Collection Method          |
|----------------------------|----------------------------------------------|-------------------------------|-------------------------------|-----------------------------|
| Service Response Time      | API endpoint response time                   | <200ms                        | >500ms for >5 minutes        | Datadog APM                 |
| Error Rate                 | Percentage of failed requests                | <0.5%                         | >2%                          | Datadog                     |
| Request Rate               | Requests per second                          | N/A                           | >2x 24h average              | Datadog                     |
| Database Query Time        | Average database query execution time        | <100ms                        | >300ms for >5 minutes        | Datadog APM                 |
| Cache Hit Ratio            | Percentage of cache hits                     | >90%                          | <70%                         | Redis/Datadog               |
| Background Job Duration    | Duration of background jobs                  | <30 minutes                   | >60 minutes                  | Datadog                     |

### 3. Database Metrics
| Metric                     | Description                                  | Target Value                  | Alert Threshold               | Collection Method          |
|----------------------------|----------------------------------------------|-------------------------------|-------------------------------|-----------------------------|
| Database Connections       | Number of active database connections        | <80% of max                   | >95% of max                  | PostgreSQL/Datadog         |
| Query Execution Time       | Average query execution time                 | <100ms                        | >300ms for >5 minutes        | PostgreSQL/Datadog         |
| Lock Waits                 | Number of queries waiting for locks          | 0                             | >10                          | PostgreSQL/Datadog         |
| Replication Lag            | Replication delay between primary/replica    | <1s                           | >5s                          | PostgreSQL/Datadog         |
| Table Size Growth          | Growth rate of critical tables               | N/A                           | >10% in 1 hour               | PostgreSQL/Datadog         |
| Index Usage                | Percentage of unused indexes                  | <10%                          | >30%                         | PostgreSQL/Datadog         |

### 4. Blockchain Node Metrics
| Metric                     | Description                                  | Target Value                  | Alert Threshold               | Collection Method          |
|----------------------------|----------------------------------------------|-------------------------------|-------------------------------|-----------------------------|
| Node Sync Status           | Whether node is in sync with network         | Synced                        | Not synced                   | Custom Script               |
| Block Height               | Current block height                         | N/A                           | >10 blocks behind            | Custom Script               |
| Peer Count                 | Number of connected peers                    | >5                            | <3                           | Custom Script               |
| RPC Response Time          | Response time for RPC requests               | <200ms                        | >500ms for >5 minutes        | Datadog                     |
| Gas Price                  | Current network gas price                    | N/A                           | >300 gwei                    | Custom Script               |
| Transaction Pool Size      | Number of pending transactions               | <1000                         | >5000                        | Custom Script               |

## Critical Service Monitoring

### 1. Frontend Services
- **Next.js Application**:
  - Server-side rendering performance
  - API route response times
  - Static asset delivery
  - Edge function execution

- **CDN**:
  - Cache hit ratio
  - Response times
  - Error rates
  - Geographic distribution

### 2. Backend Services
- **API Server**:
  - Request rates
  - Error rates
  - Response times
  - Database query performance

- **Blockchain Indexer**:
  - Sync status
  - Block processing time
  - Database write performance
  - Event processing lag

- **Background Workers**:
  - Job queue length
  - Job execution time
  - Job failure rate
  - Retry attempts

### 3. Database Services
- **PostgreSQL**:
  - Connection pool usage
  - Query performance
  - Replication status
  - Backup status

- **Redis**:
  - Memory usage
  - Cache hit ratio
  - Connection count
  - Eviction rate

### 4. Blockchain Services
- **Base Node**:
  - Sync status
  - Peer count
  - Block propagation time
  - RPC endpoint availability

- **Tenderly Fork**:
  - Simulation success rate
  - API response times
  - Webhook delivery

## Dashboard Requirements

### 1. Real-Time Dashboard (Datadog)
- **Server Health**: CPU, memory, disk, network for all servers
- **Service Status**: Response times, error rates, request rates
- **Database Health**: Connections, query performance, replication
- **Blockchain Nodes**: Sync status, peer count, block height
- **Alert Status**: Current active alerts with severity
- **Incident Tracking**: Open incidents and their status

### 2. Historical Dashboard (Datadog)
- **30-Day Performance Trends**: Server and service metrics
- **Capacity Planning**: Resource utilization trends
- **Incident History**: Past incidents and their impact
- **SLA Compliance**: Uptime and performance against SLAs
- **Cost Analysis**: Resource usage vs. cost

### 3. Blockchain Dashboard (Custom)
- **Node Status**: Sync status, peer count, block height
- **Transaction Flow**: Incoming/outgoing transactions
- **Gas Metrics**: Current gas price, gas used
- **Contract Interactions**: Calls to key contracts
- **Event Stream**: Critical contract events

## Alerting Rules

### 1. Critical Alerts (P0)
- **Service Down**: Any critical service not responding
- **High Error Rate**: >10% error rate for >5 minutes
- **Database Down**: Database unavailable or not responding
- **Blockchain Node Out of Sync**: Node >10 blocks behind
- **High CPU Usage**: >95% CPU for >10 minutes
- **High Memory Usage**: >98% memory for >5 minutes
- **Disk Full**: >99% disk usage

### 2. Warning Alerts (P1)
- **High Response Time**: >500ms for >5 minutes
- **Increased Error Rate**: >2% error rate for >5 minutes
- **High Database Load**: >80% connection pool usage
- **Replication Lag**: >5s replication lag
- **High Disk Usage**: >90% disk usage
- **High Memory Usage**: >90% memory for >10 minutes
- **Blockchain Node Issues**: <5 peers or high RPC latency

### 3. Informational Alerts (P2)
- **Daily Resource Report**: Server resource usage summary
- **Weekly Performance Report**: Service performance trends
- **Capacity Warnings**: Resource usage approaching limits
- **Backup Status**: Daily backup completion status
- **Security Updates**: Available security patches
- **SLA Compliance**: Weekly SLA compliance report