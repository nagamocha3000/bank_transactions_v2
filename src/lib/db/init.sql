begin;

--USERS TABLE
create domain contact_entry_t as
    varchar(50) not null check (value <> '' and value !~ '\s');

create table users(
    user_id serial primary key,
    email contact_entry_t unique,
    firstname contact_entry_t,
    lastname contact_entry_t,
    password varchar(100) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_login timestamptz not null default now()
);



--ACCOUNT TABLE
create table account(
    account_id serial primary key,
    user_id int not null,
    balance numeric(12,2) not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    is_active boolean not null default 't',

    foreign key (user_id) references users(user_id)
        on delete restrict on update restrict,

    constraint balance_nonnegative check(
        balance >= 0
    )
);



--ACCOUNT TRIGGER PREVENT DELETE
create or replace function trig_soft_account_delete_fn()
    returns trigger 
    language 'plpgsql'
as $$
    begin
        update account
            set is_active= 'f' where account_id = old.account_id;
        raise notice 'hard delete aborted: not allowed for account entries';
        return null;
    end;
$$;

create trigger trig_soft_account_delete
    before delete on account for each row 
    execute procedure trig_soft_account_delete_fn();



--TRANSFER_LOG TABLE
create extension if not exists "uuid-ossp";

create type transfer_status_t as enum
    ('pending', 'cancelled', 'timeout', 'error', 'confirmed');

create table transfer_log(
    transfer_log_id uuid primary key default uuid_generate_v4(),
    from_account int references account,
    to_account int references account not null,
    amount numeric(12,2) check(amount > 0),
    transfer_status transfer_status_t not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint transfer_self_send check(
        from_account <> to_account
    )
);



--TRANSFER_LOG TRIGGER VALIDATE CHANGES
create function trig_validate_transfer_log_fn()
    returns trigger 
    language 'plpgsql'
as $$
begin
    if tg_op = 'INSERT' and new.transfer_status = 'pending' then 
        return new;
    end if; 
    if tg_op = 'UPDATE' 
        and old.transfer_status = 'pending' 
        and old.from_account = new.from_account then
        return new; 
    end if;
    if tg_op = 'UPDATE' 
        and old.transfer_status = 'pending' 
        and old.from_account is null and new.from_account is null then
        return new; 
    end if; 
    raise exception 'invalid operation on transfer_log entry';
    return null;
end;
$$;

create trigger trig_validate_transfer_log
    before insert or update or delete on transfer_log for each row
    execute procedure trig_validate_transfer_log_fn();



--ACCOUNT TRIGGER ADD 1000 ON INSERTION
create or replace function trig_account_creation_bonus_fn()
    returns trigger 
    language 'plpgsql'
as $$
    declare
        bonus_amount constant int := 1000;
        bonus_transfer_id uuid;
    begin 
        with bonus as (
            insert into transfer_log(to_account, amount) values (new.account_id, bonus_amount)
            returning transfer_log_id
        )
        select transfer_log_id into bonus_transfer_id from bonus;

        update transfer_log set transfer_status = 'confirmed'
            where transfer_log_id = bonus_transfer_id;

        update account set balance = balance + bonus_amount
            where account_id = new.account_id;
        return new;
    end;
$$;

create trigger trig_account_creation_bonus
    after insert on account for each row 
    execute procedure trig_account_creation_bonus_fn();



--REQUEST_TRANSFER
create function request_transfer(from_acc int, to_acc int, amount numeric)
    returns uuid
    language 'plpgsql'
as $$
declare 
    transfer_id uuid;
begin
    with tf as (
        insert into transfer_log(from_account, to_account, amount) 
        values (from_acc, to_acc, amount)
        returning transfer_log_id
    )
    select transfer_log_id into transfer_id from tf;
    return transfer_id;
end;
$$;



--CANCEL TRANSFER
create function cancel_transfer(transfer_id uuid)
    returns boolean 
    language 'plpgsql'
as $$
declare 
    is_success boolean := 'f';
    tf_row record;
begin
    with tf_details as (
        update transfer_log 
            set transfer_status = 'cancelled'
            where transfer_log_id = transfer_id and transfer_status = 'pending'
            returning 't' as cancelled
    ) select cancelled into is_success from tf_details;
    if not found then 
        is_success := 'f';
    end if;
    return is_success;
end;
$$;




--CONFIRM TRANSFER
create function confirm_transfer(transfer_id uuid)
    returns boolean
    language 'plpgsql'
as $$
declare
    sender_acct_id int;
    tf_row transfer_log%ROWTYPE;
begin
    --update sender account, deduct balance
    select * into tf_row from transfer_log where transfer_log_id = transfer_id;
    with sender as(
        update account 
            set balance = balance - tf_row.amount 
            where account_id = tf_row.from_account 
                and is_active = 't' 
                and balance >= tf_row.amount 
            returning account_id
    )select account_id into sender_acct_id from sender;
    if not found then
        update transfer_log 
            set transfer_status = 'error'
            where transfer_log_id = transfer_id;
        return 'f';
    end if;
    --update receiever account
    update account 
        set balance = balance + tf_row.amount
        where account_id = tf_row.to_account;
    --update transfer_status in transfer_log
    update transfer_log 
        set transfer_status = 'confirmed'
        where transfer_log_id = transfer_id;
    --timeout other previous transfer requests
    update transfer_log 
        set transfer_status = 'timeout'
        where transfer_status = 'pending' and from_account = sender_acct_id;
    return 't';
end;
$$;



commit;