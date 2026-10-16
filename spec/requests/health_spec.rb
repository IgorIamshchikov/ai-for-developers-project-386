# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /up", type: :request do
  it "responds with 200" do
    get "/up"

    expect(response).to have_http_status(:ok)
  end
end
