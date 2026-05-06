DELETE FROM public.returns
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pjcooley7@gmail.com');
