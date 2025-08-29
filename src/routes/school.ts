import { Hono } from 'hono';
import { createSchool, getSchoolByCode, getSchoolById, getSchools, updateSchool } from '../controllers/school';
const schoolRoutes = new Hono();

schoolRoutes.post('/create', createSchool);
schoolRoutes.get('/get-filtered',getSchools);
schoolRoutes.get('/get/:id',getSchoolById);
schoolRoutes.get('/get/:code',getSchoolByCode);
schoolRoutes.patch('/update/:id', updateSchool);
schoolRoutes.delete('/delete/:id/:deleteType', updateSchool);


export default schoolRoutes;