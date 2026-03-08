import * as jwt_decode from 'jwt-decode';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc0NjY5NDk2MywiZXhwIjoxNzQ2Njk4NTYzfQ.jJa-yI2RHPCWhJGJvZs1V5pQXrCbVY1JISt3l5mKoEs';
const decoded = jwt_decode.jwtDecode(token);
console.log(decoded);
