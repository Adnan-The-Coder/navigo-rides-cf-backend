import { Hono } from 'hono';
import { createUser } from '../controllers/user';
const userRoutes = new Hono();

userRoutes.post('/create', createUser);


export default userRoutes;