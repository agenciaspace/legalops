-- Keep salary ranges ordered even when an upstream provider reverses them.
update public.jobs
set salary_min = least(salary_min, salary_max),
    salary_max = greatest(salary_min, salary_max)
where salary_min is not null
  and salary_max is not null
  and salary_min > salary_max;

alter table public.jobs
  add constraint jobs_salary_range_ordered
  check (
    salary_min is null
    or salary_max is null
    or salary_min <= salary_max
  ) not valid;

alter table public.jobs
  validate constraint jobs_salary_range_ordered;
