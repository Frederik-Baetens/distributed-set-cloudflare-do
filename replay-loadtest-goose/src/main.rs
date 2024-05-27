use std::collections::HashMap;

use rand::{thread_rng, Rng};
use rand::distributions::Alphanumeric;

use goose::prelude::*;

#[tokio::main]
async fn main() -> Result<(), GooseError> {
    GooseAttack::initialize()?
        .register_scenario(scenario!("LoadtestReplay")
            .register_transaction(transaction!(loadtest_replay))
        )
        .execute()
        .await?;

    Ok(())
}

async fn loadtest_replay(user: &mut GooseUser) -> TransactionResult {
    let request_builder = user.get_request_builder(&GooseMethod::Put, "")?.json(&gen_body());

    let goose_request = GooseRequest::builder()
        .set_request_builder(request_builder)
        .expect_status_code(200)
        .build();

    let goose = user.request(goose_request).await?;

    match goose.response {
        Ok(response) => {
            let headers = response.headers().clone();
            let response_text = response.text().await.unwrap_or("NO BODY".to_string());

            user.log_debug("response", Some(&goose.request), Some(&headers), Some(&response_text))?;
        },
        Err(e) => user.log_debug(&format!("error loading /: {}", e), Some(&goose.request), None, None)?,
    };

    Ok(())
}

fn gen_body() -> HashMap<String, Vec<String>> {
    let mut map: HashMap<String, Vec<String>> = HashMap::new();
    map.insert("reportIDs".to_string(), (0..10).map(|_| gen_random_string()).collect());
    map
}

fn gen_random_string() -> String {
    return thread_rng().sample_iter(Alphanumeric).take(16).map(char::from).collect();
}

