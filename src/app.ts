import express, { NextFunction, Request, Response } from "express";
import { data } from "./data";
const app = express();
const port = 3001;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

type KeyOfUser = keyof typeof data[number];
const keysOfData = Object.keys(data[0]);
const genders = [...new Set(data.map(({ gender }) => gender))];

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
const validateIPaddress = (ipaddress: string) => {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    ipaddress
  );
};

const checkBodyKey = (body: any) => {
  return Object.keys(body).reduce((acc, key) => {
    if (keysOfData.includes(key) && key != "id") {
      acc[key as KeyOfUser] = body[key];
    }
    return acc;
  }, {} as Record<KeyOfUser, any>);
};

const checkBody = (body: any) => {
  const errors = [];
  !body.first_name && errors.push("Missing first_name");
  !body.last_name && errors.push("Missing last_name");
  !body.email && errors.push("Missing email");
  body.email && !validateEmail(body.email) && errors.push("Email not valid");
  !body.gender && errors.push("Missing gender");
  body.gender &&
    !genders.includes(body.gender) &&
    errors.push("Gender not valid");
  !body.ip_address && errors.push("Missing ip_address");
  body.ip_address && !validateIPaddress && errors.push("ip_address not valid");
  return errors;
};

const checkValidBody = (req: Request, res: Response, next: NextFunction) => {
  req.body = checkBodyKey(req.body);
  const errors = checkBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json(errors);
  }
  next();
};

const checkValidId = (
  { params }: Request,
  res: Response,
  next: NextFunction
) => {
  const { locals } = res;
  if (!Number(params.id) || Number(params.id) < 0) {
    return res.status(400).json({ message: `Invalid id: ${params.id}` });
  }
  const index = data.findIndex(({ id }) => id == Number(params.id));
  if (index == -1) return res.status(404).json({ message: "User not found" });
  locals.index = index;
  next();
};

app.get("/status", (_, response) => {
  response.json({ message: "Ciao" });
});

app.get("/users", ({ query }: { query: Record<KeyOfUser, any> }, response) => {
  const queryNotIncluded = Object.keys(query).filter(
    (item) => !keysOfData.includes(item)
  );
  if (queryNotIncluded.length > 0) {
    return response
      .status(400)
      .json({ message: "Query Params not valid:" + queryNotIncluded });
  }
  // sanificazione!
  let users = [...data];
  Object.keys(query).forEach((key) => {
    users = users.filter(
      (user) => user[key as KeyOfUser] == query[key as KeyOfUser]
    );
  });
  response.json({ items: users, count: users.length });
});

app.get("/users/:id", checkValidId, (_, res) => {
  return res.json(data[res.locals.index]);
});

app.post("/users", checkValidBody, ({ body }, response) => {
  const newId = Math.max(-1, ...data.map(({ id }) => id)) + 1;
  const newItem = { ...body, id: newId };
  data.push(newItem);
  response.status(201).json(newItem);
});

app.put("/users/:id", checkValidId, checkValidBody, ({ body, params }, res) => {
  const item = { ...body, id: Number(params.id) };
  data[res.locals.index] = item;
  res.json(item);
});

app.delete("/users/:id", checkValidId, ({ body, params }, res) => {
  // data = data.splice(index, index + 1);
  // res.json(elementDeleted);
});
app.listen(port, () => console.log("Il mio server è su"));
