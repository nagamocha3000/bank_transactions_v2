# API Interface

## Users

* `POST: /users/signup`: 
  
  

* `POST: /users/login`:
  
  

* `POST: /users/logout`:
  
  

* `GET: /users/{id}`: 
  
  Returns user details



## Accounts

* `GET /users/{id}/accounts`:
  
  Returns the list of accounts belonging to the user
  
  

* `POST /users/{id}/accounts/new`
  
  For creating a new account
  
  

* `GET /users/{id}/accounts/{id}`
  
  Retrieves the balance, whether account is active, created_at and updated_at values. JSON. 
  
  

* `GET /users/{id}/accounts/{id}/mini-statement`
  
  Returns mini-statement: last 6 -10 transfers both into and out of the account. An account's balance is a resource. Transfers both into and out of the account affect the balance's value. To get their balance, a client sends a GET request to this URL. The JSON payload consists of both of the balance and a UTC timestamp of the last time the balance was modified. The balance value by itself is at the very least partially true and if the client were to take it as it is, (that is, assume the balance is correct at that given instance) they might act on outdated information given that the balance is probably getting updated concurrently as the request is being made. However, paired with the last modified timestamp, the account owner is made cognizant of the degree of accuracy in relation to the time.
  
  

* `GET /users/{id}/accounts/{id}/full-statement`
  
  Returns entire history of transactions related to the account
  
  

## Transfers

* `GET /users/{id}/accounts/{id}/transfers/{id}`:
  
  Retrieves the receiver, state, amount, time values related to the transfer. The transfer must have been initiated by the given account and user authorized otherwise forbidden. When a transfer is requested, the transfer entry is created and it begins with a 'pending' state. Once it is either confirmed or cancelled, its state changes to either 'error', 'confirmed', 'cancelled' or 'timeout'. This state change is one-way and irreversible. All through the lifetime of a transfer request, the state can be inquired via a GET request to the this URL.
  
  

* `POST /users/{id}/accounts/{id}/transfers`:
  
  Creates a new transfer request. User must send the receiver's account ID plus the amount the sender intends to send. As stated in the db-design document, the transfer process is divided into two stages, transfer request and transfer confirmation/cancellation. From the perspective of the client, requesting for a transfer to take place creates a resource that represents this request. Therefore, the appropriate verb is POST.
  
  

* `PUT /users/{id}/accounts/{id}/transfers/{id}`:
  
  The user sends an action pertaining the transfer, either confirm or cancel. The HTTP verb used is PUT since such actions are idempotent. This is because it shouldn't matter whether a transfer is confirmed once or several times. The same is the case with cancelling a transfer. Response: http 201 plus inclusion of location header pointing to resource - the GET users...transfer/{id}. Further details - [link]([https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.30](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.30).
  
  

* `GET /users/{id}/accounts/{id}/transfers`
  
  User retrieves list of transfers for the account. Should allow for filtering via query parameters eg '?state=error|pending|confirmed' etc or '?to={receiver_id}'. Plus also pagination for long lists
