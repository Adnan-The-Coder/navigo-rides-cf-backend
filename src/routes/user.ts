import { Hono } from 'hono';
import { createUser, deleteUser, getUserByUuid, getUsers, updateUser } from '../controllers/user';
const userRoutes = new Hono();

userRoutes.post('/create', createUser);
userRoutes.get('/get-all',getUsers)
userRoutes.get('/get/:uuid',getUserByUuid);
userRoutes.patch('/update/:uuid',updateUser);
userRoutes.delete('/delete/:deleteType/:uuid',deleteUser);


export default userRoutes;