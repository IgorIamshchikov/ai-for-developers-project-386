require "rails_helper"

RSpec.describe "Pages", type: :request do
  describe "GET /" do
    it "responds successfully" do
      get root_path

      expect(response).to have_http_status(:success)
    end

    it "renders the landing page" do
      get root_path

      expect(response.body).to include("Календарь звонков")
    end
  end

  describe "GET /up" do
    it "responds with the health check" do
      get rails_health_check_path

      expect(response).to have_http_status(:success)
    end
  end
end
