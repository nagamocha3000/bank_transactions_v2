with txs as (
select
    substring(transfer_log_id::text,1,8) as id_truncated,
    updated_at,
    coalesce((select u.firstname || ' ' || u.lastname || ',' || a.account_id
            from account a join users u using(user_id)
            where 
                (a.account_id = to_account and from_account = 2250) or
                (a.account_id = from_account and to_account = 2250)), 'deposit') as tx_details,    
    case when from_account = 2250 then -amount else amount end as tx_amount
from transfer_log
where 2250 in (to_account, from_account) and transfer_status = 'confirmed'
)select 
    id_truncated,
    to_char(updated_at, 'dd/mm/yy hh:mm pm') as tx_date,
    tx_details,
    case when tx_amount < 0 then -tx_amount else null end as credit,
    case when tx_amount > 0 then tx_amount else null end as debit,
    sum (tx_amount) over (
        order by updated_at asc
    ) as balance
from txs
order by updated_at desc;