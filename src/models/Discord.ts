import type { Context } from 'hono';
import { config } from '../config';
import { User } from '.';

export class Discord {
  static async getOAuthUrl() {
    const state = crypto.randomUUID();
    const url = new URL('https://discord.com/api/oauth2/authorize');
    console.log(config.DISCORD_REDIRECT_URI);
    url.searchParams.set('client_id', config.DISCORD_CLIENT_ID);
    url.searchParams.set('redirect_uri', config.DISCORD_REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);
    url.searchParams.set('scope', 'role_connections.write identify');
    url.searchParams.set('prompt', 'consent');
    return { state, url: url.toString() };
  }

  static async getOAuthTokens(
    code: string
  ) {
    const url = 'https://discord.com/api/v10/oauth2/token';
    const data = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      client_secret: config.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.DISCORD_REDIRECT_URI,
    });

    const response = await fetch(url, { method: 'POST', body: data, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    return response.json()
  }

  static async getUserData(tokens: any) {
    const url = 'https://discord.com/api/v10/oauth2/@me';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    return response.json();
  }

  static async pushMetadata(
    discord_user_id: string,
    data: any, // inside the data object goes the refresh_token, TODO
    metadata: { pilot: number, captain: number, navigator: number },
    ctx: Context
  ) {

    console.log('Pushing metadata to discord')
    console.log(metadata)
    // GET/PUT /users/@me/applications/:id/role-connection
    const url = `https://discord.com/api/v10/users/@me/applications/${config.DISCORD_CLIENT_ID}/role-connection`;
    // const accessToken = await getAccessToken(discord_user_id, data);
    const { access_token: accessToken } = await User.findOne('discord_user_id', discord_user_id, ctx.env.DB)
    const body = {
      platform_name: 'Stellar Discord Bot',
      metadata,
    };
    try {
      await fetch(url, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Pushing successful')

    } catch (err) {
      console.error(err);
      // console.log(util.inspect(err.response?.data, false, 12));
      // throw e;
    }
  }

  static async getMetadata(discord_user_id: string, data: any, ctx: Context) {
    // GET/PUT /users/@me/applications/:id/role-connection
    const url = `https://discord.com/api/v10/users/@me/applications/${config.DISCORD_CLIENT_ID}/role-connection`;
    const { access_token: accessToken } = await User.findOne('discord_user_id', discord_user_id, ctx.env.DB)
    const metadata = (await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    })).json()
    return metadata;
    // const accessToken = await getAccessToken(discord_user_id, data);
    // const res = await request({
    //   url,
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });
    // return res.data;
  }
}