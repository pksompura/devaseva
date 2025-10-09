import fetch from "node-fetch";

export async function redisRestSet(key, value) {
  const response = await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}/${value}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    }
  );
  return response.json();
}

export async function redisRestGet(key) {
  const response = await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    }
  );
  return response.json();
}
