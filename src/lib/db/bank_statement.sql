select
    substring(transfer_log_id::text,1,8) as tx_id,
    to_char(updated_at, 'dd/mm/yy hh:mm pm') as tx_date,
    coalesce((select u.firstname || ' ' || u.lastname || ',' || a.account_id
            from account a join users u using(user_id)
            where 
                (a.account_id = to_account and from_account = 2250) or
                (a.account_id = from_account and to_account = 2250)), 'deposit') as details,
    case when from_account = 2250 then amount else null end as credit,
    case when to_account = 2250 then amount else null end as debit
from transfer_log
where 2250 in (to_account, from_account) and transfer_status = 'confirmed'
order by updated_at desc;

;