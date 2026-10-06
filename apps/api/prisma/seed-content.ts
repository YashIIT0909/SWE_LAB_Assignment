/** Template code / diagram source shown on each component page, keyed by component name. */
export const CONTENT: Record<string, string> = {
  'Observer pattern class diagram': `@startuml
interface Observer {
  +update(event: Event)
}
class Subject {
  -observers: List<Observer>
  +attach(o: Observer)
  +detach(o: Observer)
  +notifyAll(event: Event)
}
class ConcreteObserver {
  +update(event: Event)
}
Subject o--> "*" Observer
Observer <|.. ConcreteObserver
@enduml`,

  'Strategy pattern class diagram': `@startuml
interface Strategy {
  +execute(data): Result
}
class Context {
  -strategy: Strategy
  +setStrategy(s: Strategy)
  +run(data): Result
}
class ConcreteStrategyA
class ConcreteStrategyB
Context o--> Strategy
Strategy <|.. ConcreteStrategyA
Strategy <|.. ConcreteStrategyB
@enduml`,

  'Singleton in Java': `public final class Singleton {
    private Singleton() {}

    // Holder idiom: the instance is created lazily, on first access, and thread-safely
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}`,

  'Builder in TypeScript': `export class User {
  private constructor(
    readonly name: string,
    readonly email: string,
    readonly age?: number,
  ) {}

  static builder() {
    return new UserBuilder()
  }

  static _create(name: string, email: string, age?: number) {
    return Object.freeze(new User(name, email, age))
  }
}

class UserBuilder {
  private name = ''
  private email = ''
  private age?: number

  withName(name: string) { this.name = name; return this }
  withEmail(email: string) { this.email = email; return this }
  withAge(age: number) { this.age = age; return this }

  build() {
    if (!this.name || !this.email) throw new Error('name and email are required')
    return User._create(this.name, this.email, this.age)
  }
}

// const u = User.builder().withName('Ada').withEmail('ada@example.com').build()`,

  'Adapter pattern class diagram': `@startuml
interface Target {
  +request()
}
class Client
class Adapter {
  -adaptee: Adaptee
  +request()
}
class Adaptee {
  +specificRequest()
}
Client --> Target
Target <|.. Adapter
Adapter --> Adaptee : delegates
@enduml`,

  'CSV parser': `def parse_csv(lines, delimiter=","):
    """Stream rows from an iterable of lines (RFC 4180, quoted fields and "" escapes)."""
    row, field, in_quotes = [], [], False
    for line in lines:
        i = 0
        while i < len(line):
            ch = line[i]
            if in_quotes:
                if ch == '"' and line[i + 1 : i + 2] == '"':
                    field.append('"')
                    i += 1
                elif ch == '"':
                    in_quotes = False
                else:
                    field.append(ch)
            elif ch == '"':
                in_quotes = True
            elif ch == delimiter:
                row.append("".join(field))
                field = []
            elif ch not in "\\r\\n":
                field.append(ch)
            i += 1
        if in_quotes:
            field.append("\\n")  # quoted field continues on the next line
        else:
            row.append("".join(field))
            yield row
            row, field = [], []


if __name__ == "__main__":
    for r in parse_csv(['name,note', 'Ada,"likes ""math"", code"']):
        print(r)`,

  'JSON tokenizer': `#include <stddef.h>
#include <ctype.h>
#include <string.h>

typedef enum { T_OBJ, T_ARR, T_STR, T_NUM, T_LIT, T_ERR } TokType;
typedef struct { TokType type; const char *start; size_t len; } Token;

/* Allocation-free: tokens point into the input buffer. Returns tokens written. */
size_t json_tokenize(const char *s, Token *out, size_t max) {
    size_t n = 0;
    while (*s && n < max) {
        if (isspace((unsigned char)*s) || *s == ',' || *s == ':') { s++; continue; }
        Token t = { T_ERR, s, 1 };
        if (*s == '{' || *s == '}') t.type = T_OBJ;
        else if (*s == '[' || *s == ']') t.type = T_ARR;
        else if (*s == '"') {
            const char *p = s + 1;
            while (*p && *p != '"') p += (*p == '\\\\' && p[1]) ? 2 : 1;
            t.type = *p ? T_STR : T_ERR;
            t.len = (size_t)(p - s) + (*p ? 1 : 0);
        } else if (*s == '-' || isdigit((unsigned char)*s)) {
            const char *p = s + 1;
            while (isdigit((unsigned char)*p) || (*p && strchr(".eE+-", *p))) p++;
            t.type = T_NUM; t.len = (size_t)(p - s);
        } else if (isalpha((unsigned char)*s)) {
            const char *p = s;
            while (isalpha((unsigned char)*p)) p++;
            t.type = T_LIT; t.len = (size_t)(p - s);   /* true / false / null */
        }
        out[n++] = t;
        s += t.len;
    }
    return n;
}`,

  'Merge sort': `#include <algorithm>
#include <iterator>
#include <vector>

// Stable O(n log n) merge sort on random-access iterators.
template <typename It>
void merge_sort(It first, It last) {
    auto n = std::distance(first, last);
    if (n < 2) return;
    It mid = first + n / 2;
    merge_sort(first, mid);
    merge_sort(mid, last);
    std::inplace_merge(first, mid, last);   // stable merge of the two sorted halves
}

// int main() {
//     std::vector<int> v{5, 2, 9, 1, 5, 6};
//     merge_sort(v.begin(), v.end());       // 1 2 5 5 6 9
// }`,

  'Binary search': `public final class BinarySearch {
    /** Returns the index of key in the sorted array, or -(insertionPoint + 1) if absent. */
    public static <T extends Comparable<? super T>> int search(T[] a, T key) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;          // avoids int overflow
            int cmp = a[mid].compareTo(key);
            if (cmp < 0) lo = mid + 1;
            else if (cmp > 0) hi = mid - 1;
            else return mid;
        }
        return -(lo + 1);
    }

    public static void main(String[] args) {
        Integer[] a = {1, 3, 5, 7, 9};
        System.out.println(search(a, 7));       // 3
        System.out.println(search(a, 4));       // -3
    }
}`,

  'Library system ERD': `@startuml
entity Member {
  *member_id : int <<PK>>
  --
  name : varchar
  email : varchar
}
entity Book {
  *book_id : int <<PK>>
  --
  title : varchar
  isbn : varchar
}
entity Loan {
  *loan_id : int <<PK>>
  --
  member_id : int <<FK>>
  book_id : int <<FK>>
  borrowed_on : date
  due_on : date
  returned_on : date
}
Member ||--o{ Loan : borrows
Book ||--o{ Loan : is lent in
@enduml`,

  'Order processing DFD': `Level 0 (context diagram)
  [Customer] --order--> (0 Order Processing System) --invoice--> [Customer]
  (0 Order Processing System) --stock request--> [Warehouse]
  [Warehouse] --shipment confirmation--> (0 Order Processing System)

Level 1
  (1.0 Validate order)  <-- order --        [Customer]
  (1.0 Validate order)  -- valid order -->  (2.0 Check stock)
  (2.0 Check stock)     <-> D1 Inventory
  (2.0 Check stock)     -- pick list -->    [Warehouse]
  (2.0 Check stock)     -- confirmed -->    (3.0 Generate invoice)
  (3.0 Generate invoice) -> D2 Orders
  (3.0 Generate invoice) -- invoice -->     [Customer]`,

  'Login form widget': `<form id="login" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required autocomplete="email" />
  <span id="email-err" role="alert"></span>

  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" minlength="8" required />
  <span id="pw-err" role="alert"></span>

  <button type="submit">Log in</button>
</form>

<script>
  const form = document.getElementById('login')
  const rules = {
    email: (v) => (/^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$/i.test(v) ? '' : 'Enter a valid email'),
    password: (v) => (v.length >= 8 ? '' : 'Password must be at least 8 characters'),
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    let ok = true
    for (const [name, check] of Object.entries(rules)) {
      const msg = check(form.elements[name].value)
      document.getElementById(name === 'email' ? 'email-err' : 'pw-err').textContent = msg
      if (msg) ok = false
    }
    if (ok) form.submit()
  })
</script>`,

  'JWT auth middleware': `import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'

interface TokenPayload {
  sub: string
  role: 'CATALOGUER' | 'USER'
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next() // anonymous request

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    }) as TokenPayload
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } })
  }
}`,

  'Payroll structure chart': `Payroll System
├── Get Employee Data
│   ├── Read employee file
│   └── Validate employee record
├── Calculate Pay
│   ├── Compute gross pay
│   ├── Compute deductions
│   │   ├── Tax
│   │   └── Insurance
│   └── Compute net pay
└── Produce Output
    ├── Print payslip
    └── Update payroll ledger

Data couples: employee record (down), gross pay, deductions, net pay (up)
Control couple: end-of-file flag (up from Read employee file)`,

  'Legacy XML parser': `import java.io.File;
import javax.xml.parsers.SAXParserFactory;
import org.xml.sax.Attributes;
import org.xml.sax.helpers.DefaultHandler;

public class LegacyXmlParser extends DefaultHandler {
    @Override
    public void startElement(String uri, String local, String qName, Attributes attrs) {
        System.out.println("<" + qName + "> attrs=" + attrs.getLength());
    }

    @Override
    public void characters(char[] ch, int start, int length) {
        String text = new String(ch, start, length).trim();
        if (!text.isEmpty()) System.out.println("  text: " + text);
    }

    public static void main(String[] args) throws Exception {
        SAXParserFactory.newInstance().newSAXParser().parse(new File(args[0]), new LegacyXmlParser());
    }
}`,

  'Bubble sort demo': `#include <stdio.h>

void bubble_sort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                swapped = 1;
            }
        }
        if (!swapped) break;   /* already sorted */
    }
}

int main(void) {
    int a[] = {5, 1, 4, 2, 8};
    bubble_sort(a, 5);
    for (int i = 0; i < 5; i++) printf("%d ", a[i]);
    return 0;
}`,

  'Old billing DFD': `Level 0
  [Customer] --usage data--> (0 Billing Process) --bill--> [Customer]
  [Customer] --payment--> (0 Billing Process)
  (0 Billing Process) --ledger entries--> [Accounts]

Level 1
  (1.0 Rate usage)      <-- usage data -- [Customer]
  (1.0 Rate usage)      <-> D1 Tariffs
  (2.0 Produce bill)    <-- rated usage -- (1.0 Rate usage)
  (2.0 Produce bill)    -> D2 Invoices
  (2.0 Produce bill)    -- bill --> [Customer]
  (3.0 Record payment)  <-- payment -- [Customer]
  (3.0 Record payment)  <-> D2 Invoices
  (3.0 Record payment)  -- ledger entries --> [Accounts]`,
}
